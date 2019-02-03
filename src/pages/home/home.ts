import { Component, ViewChild } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { Socket } from 'ng-socket-io';

declare var SimplePeer;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class HomePage {
  @ViewChild('rtcVideo') rtcVideo;

  targetpeer: any;
  peer: any;
  n = <any>navigator;
  caller: boolean = false;
  isConnected: boolean = false;

  constructor(public navCtrl: NavController, public socket: Socket, private androidPermissions: AndroidPermissions) {
    this.caller = location.hash === '#call';
    let that = this;
    this.socket.connect();
    this.socket.on('call-video', (data) => {
      let peer:any = data;
      if (peer.type === 'offer') {
        if (location.hash !== '#call') {
          console.log('offer:', data);
          that.targetpeer = JSON.stringify(data);
        }
      }
      else {
        if (location.hash === '#call') {
          console.log('answer:', data);
          that.targetpeer = JSON.stringify(data);
          if (this.peer) this.peer.signal(JSON.parse(this.targetpeer));
        }
      }
    })
    this.socket.on('incall-video', () => {
      this.isConnected = true;
    });
    this.socket.on('ended-video', () => {
      this.isConnected = false;
    })
    this.checkPermissions();
    this.init();
  }

  ionViewDidLoad() {
    console.log(this.rtcVideo)
  }

  checkPermissions(){
    this.androidPermissions.requestPermissions([this.androidPermissions.PERMISSION.CAMERA, this.androidPermissions.PERMISSION.RECORD_AUDIO]);

    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.CAMERA).then(
      success => console.log("Hey you have permission"),
      err => {
        console.log("Uh oh, looks like you don't have permission");
        this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA);
      }
    );

    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO).then(
      success => console.log("Hey you have permission"),
      err => {
        console.log("Uh oh, looks like you don't have permission");
        this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO);
      }
    );
  }

  init() {
    let peerx: any;
    let that = this;
    this.n.getUserMedia = (this.n.getUserMedia || this.n.webkitGetUserMedia || this.n.mozGetUserMedia || this.n.msGetUserMedia);
    this.n.getUserMedia({ video:true, audio:true }, function(stream) {
      peerx = new SimplePeer({
        initiator: location.hash === '#call',
        trickle: false,
        stream: stream,
        // iceTransportPolicy: "relay",
        // config: {
        //   iceServers: [/*{ urls: "stun:stun.l.google.com:19302" }*/]
        // }
      })

      peerx.on('connect', function() {
        that.socket.emit('incall-video');
        console.log("peer connect");
        console.log("isConnected: ", that.isConnected)
      })
      
      peerx.on('signal', function(data) {
        console.log('signal:', JSON.stringify(data));
        
        if (location.hash !== '#call') {
          that.targetpeer = JSON.stringify(data);
        }
        that.socket.emit('call-video', data);
      })
      
      peerx.on('data', function(data) {
        console.log('Recieved message:' + data);
      })
      
      peerx.on('stream', function(stream) {
        console.log(that.rtcVideo);
        // that.rtcVideo.nativeElement.src = URL.createObjectURL(stream);
        that.rtcVideo.nativeElement.srcObject = stream;
        that.rtcVideo.nativeElement.play();
      })

      peerx.on('close', function() {
        that.rtcVideo.nativeElement.srcObject = null;
        that.rtcVideo.nativeElement.pause();
        console.log("peer close");
        that.targetpeer = null;
        that.isConnected = false;
        that.socket.emit('ended-video');
        // that.init();
      })
      peerx.on('error', function(err) {
        console.log(err);
        that.targetpeer = null;
        that.isConnected = false;
      })
    
    }, function(err){
    console.log('Failed to get stream', err);
    });
    
    setTimeout(() => {
      this.peer = peerx;
      console.log('peer:constructor', JSON.stringify(this.peer));
    }, 5000);
  }

  connect() {
    if (this.peer) {
      this.peer.signal(JSON.parse(this.targetpeer));
    }
  }
  
  message() {
    if (this.peer) this.peer.send('Hello world');
  }

  disconnect() {
    if (this.peer) this.peer.destroy();
  }

}
