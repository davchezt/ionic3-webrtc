import { Component, ViewChild } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
// import { AndroidPermissions } from '@ionic-native/android-permissions';
// import { BackgroundMode } from '@ionic-native/background-mode';

import { Socket } from 'ng-socket-io';

declare var SimplePeer;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class HomePage {
  @ViewChild('rtcVideo') rtcVideo;
  @ViewChild('locVideo') locVideo;

  targetpeer: any;
  peer: any;
  n = <any>navigator;
  caller: boolean = false;
  isConnected: boolean = false;
  isInit: boolean = false;
  roomId = "vidoe-call";
  constructor(
    public navCtrl: NavController,
    public socket: Socket, 
    // private androidPermissions: AndroidPermissions,
    // private platform: Platform,
    // private backgroundMode: BackgroundMode
  ) {
    // if (!this.isInit) 
    // this.startAnu();
    // if (this.backgroundMode.isEnabled() && this.platform.is('android')) {
    //   if (this.backgroundMode.isActive()) {
    //     if (!this.isInit) this.startAnu();
    //   }
    //   if (this.platform.is('android')) {
    //     try {
    //       this.backgroundMode.on("activate").subscribe(()=>{
    //         this.backgroundMode.disableWebViewOptimizations();
    //         this.backgroundMode.moveToBackground();
    //         this.socket.emit('stop-call');
    //       });
    //     }
    //     catch(err) {
    //       console.log(err);
    //     }
    //   }
    // }
    // Detect run on background
    // window.addEventListener('pause', () => {
    //   console.log('app:pause');
    //   this.socket.emit('stop-call');
    // }, false);
    // window.addEventListener('resume', () => {
    //   console.log("app:resume");
    //   this.socket.emit('stop-call');
    // }, false);
    
  }

  ionViewDidLoad() {
    // console.log(this.rtcVideo)
    this.startAnu();
  }

  startAnu() {
    this.caller = location.hash === '#call';
    this.socket.connect();
    this.socket.emit('subscribe', this.roomId);
    this.socket.on('start-call', (data) => {
      let peer:any = data;
      if (peer.data.type === 'offer') {
        if (location.hash !== '#call') {
          console.log('offer:', peer.data);
          this.targetpeer = JSON.stringify(peer.data);
        }
      }
      else {
        if (location.hash === '#call') {
          console.log('answer:', peer.data);
          this.targetpeer = JSON.stringify(peer.data);
          if (this.peer) {
            this.peer.signal(JSON.parse(this.targetpeer));
          }
        }
      }
    })
    this.socket.on('in-call', (data) => {
      console.log('in-call')
      this.isConnected = true;
    });
    this.socket.on('chat-call', (data) => {
      let peer:any = data;
      console.log(peer.message);
    });
    this.socket.on('stop-call', (data) => {
      this.isConnected = false;
      console.log('stop-call')
    })
    // if (this.platform.is('android')) {
    //   this.checkPermissions();
    // }
    this.init();
    // this.isInit = true;
  }

  // checkPermissions(){
  //   this.androidPermissions.requestPermissions([this.androidPermissions.PERMISSION.CAMERA, this.androidPermissions.PERMISSION.RECORD_AUDIO]);

  //   this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.CAMERA).then(
  //     success => console.log("Hey you have permission"),
  //     err => {
  //       console.log("Uh oh, looks like you don't have permission");
  //       this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA);
  //     }
  //   );

  //   this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO).then(
  //     success => console.log("Hey you have permission"),
  //     err => {
  //       console.log("Uh oh, looks like you don't have permission");
  //       this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO);
  //     }
  //   );
  // }

  init() {
    let peerx: any = null;
    let that = this;
    this.n.getUserMedia = (this.n.getUserMedia || this.n.webkitGetUserMedia || this.n.mozGetUserMedia || this.n.msGetUserMedia);
    this.n.getUserMedia({ video:true, audio:true }, function(stream) {
      that.locVideo.nativeElement.srcObject = stream;
      that.locVideo.nativeElement.play();
      peerx = new SimplePeer({
        initiator: location.hash === '#call',
        trickle: false,
        stream: stream,
        iceTransportPolicy: "relay",
        config: {
          iceServers: [
            // { urls: 'stun:stun.l.google.com:19302' },
            // { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
            // {
            //   url: 'turn:turn.anyfirewall.com:443?transport=tcp',
            //   credential: 'webrtc',
            //   username: 'webrtc'
            // },
            {
              url: 'stun:numb.viagenie.ca',
              credential: '4Bahagia4',
              username: 'davchezt@gmail.com'
            },
            {
              url: 'turn:numb.viagenie.ca',
              credential: '4Bahagia4',
              username: 'davchezt@gmail.com'
            }
          ]
        }
      })

      peerx.on('connect', function() {
        that.socket.emit('in-call', { room: that.roomId });
        console.log("peer connect");
        console.log("isConnected: ", that.isConnected)
      })
      
      peerx.on('signal', function(data) {
        // console.log('signal:', JSON.stringify(data));
        // that.locVideo.nativeElement.srcObject = stream;
        // that.locVideo.nativeElement.play();
        
        if (location.hash !== '#call') {
          that.targetpeer = JSON.stringify(data);
        }
        that.socket.emit('start-call', { room: that.roomId, data: data });
      })
      
      peerx.on('data', function(data) {
        console.log('Recieved message:' + data);
      })
      
      peerx.on('stream', function(streams) {
        // console.log(that.rtcVideo);
        // that.rtcVideo.nativeElement.src = URL.createObjectURL(stream);
        that.rtcVideo.nativeElement.srcObject = streams;
        that.rtcVideo.nativeElement.play();
      })

      peerx.on('close', function() {
        console.log("peer close");
        that.disconnect();
        that.socket.emit('stop-call', { room: that.roomId });
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
    
    const timeOut = peerx !== null ? 100:5000;
    setTimeout(() => {
      this.peer = peerx;
      console.log('peer:constructor', this.peer);
    }, timeOut);
  }

  connect() {
    if (this.peer) {
      this.peer.signal(JSON.parse(this.targetpeer));
    }
  }
  
  message() {
    if (this.peer) {
      this.peer.send("test");
      this.socket.emit('chat-call', { room: this.roomId, message: "test"});
    }
  }

  disconnect() {
    if (this.peer) {
      this.rtcVideo.nativeElement.pause();
      this.rtcVideo.nativeElement.srcObject = null;

      this.peer.destroy();
      this.peer = null;
      this.targetpeer = null;
      const timeOut = this.peer !== null ? 100:5000;
      setTimeout(() => {
        this.init();
      }, timeOut);
    }
  }

}
