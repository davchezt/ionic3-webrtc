import { Component, ViewChild } from '@angular/core';
import { NavController/*, Platform*/ } from 'ionic-angular';
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

  cameraStream: any;
  targetpeer: any;
  peer: any;
  n = <any>navigator;
  caller: boolean = false;
  isConnected: boolean = false;
  isInit: boolean = false;
  roomId = "vidoe-call";
  smileShow: boolean = false;
  heartShow: boolean = false;
  timeOut: any;
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
    this.startAnu();
  }

  startAnu() {
    this.caller = location.hash === '#call';
    this.socket.connect();
    this.socket.emit('subscribe', this.roomId);
    this.socket.on('start-call', (data) => {
      let peer:any = data;
      if (peer.data.type === 'offer') {
        if (!this.caller) {
          console.log('offer:', peer.data);
          this.targetpeer = JSON.stringify(peer.data);
        }
      }
      else {
        if (this.caller) {
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
      if (this.caller) {
        if(!peer.message.sender) {
          if (peer.message.text == 'ping') {
            if (this.timeOut) clearTimeout(this.timeOut);
            this.smileShow = false;
            this.heartShow = false;
            this.showSmile();
          }
          else {
            if (this.timeOut) clearTimeout(this.timeOut);
            this.smileShow = false;
            this.heartShow = false;
            this.showHeart();
          }
        }
      }
      else {
        if(peer.message.sender) {
          if (peer.message.text == 'ping') {
            if (this.timeOut) clearTimeout(this.timeOut);
            this.smileShow = false;
            this.heartShow = false;
            this.showSmile();
          }
          else {
            if (this.timeOut) clearTimeout(this.timeOut);
            this.smileShow = false;
            this.heartShow = false;
            this.showHeart();
          }
        }
      }
    });
    this.socket.on('stop-call', (data) => {
      this.isConnected = false;
      console.log('stop-call')
    })

    this.init();
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
    this.n.getUserMedia = (this.n.getUserMedia || this.n.webkitGetUserMedia || this.n.mozGetUserMedia || this.n.msGetUserMedia);
    this.n.getUserMedia({ video:true, audio:true }, (stream) => {
      this.cameraStream = stream;
      if (!this.locVideo.nativeElement.srcObject) this.locVideo.nativeElement.srcObject = this.cameraStream;
      this.locVideo.nativeElement.play();
      this.peer = new SimplePeer({
        initiator: this.caller,
        trickle: false,
        stream: this.cameraStream,
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
      });

      this.peer.on('connect', () => {
        this.socket.emit('in-call', { room: this.roomId });
        console.log("peer connect");
        console.log("isConnected: ", this.isConnected)
      });
      
      this.peer.on('signal', (data) => {
        // console.log('signal:', JSON.stringify(data));

        this.socket.emit('start-call', { room: this.roomId, data: data });
      });
      
      this.peer.on('data', (data) => {
        console.log('Recieved message:' + data);
        this.showSmile();
      });
      
      this.peer.on('stream', (streams) => {
        this.rtcVideo.nativeElement.srcObject = streams;
        this.rtcVideo.nativeElement.play();
      });

      this.peer.on('close', () => {
        console.log("peer close");
        this.disconnect();
        this.socket.emit('stop-call', { room: this.roomId });
        stream.getVideoTracks().forEach(function(track) {
          track.stop();
        });
        stream.getAudioTracks().forEach(function(track) {
          track.stop();
        });
        if (this.cameraStream) {
          this.cameraStream.getVideoTracks().forEach(function(track) {
            track.stop();
          });
          this.cameraStream.getAudioTracks().forEach(function(track) {
            track.stop();
          });
        }
      });

      this.peer.on('error', (err) => {
        console.log(err);
        this.disconnect();
        this.socket.emit('stop-call', { room: this.roomId });
      });

    }, (err) => {
      console.log('Failed to get stream', err);
    });
  }

  connect() {
    if (this.peer) {
      this.peer.signal(JSON.parse(this.targetpeer));
    }
  }
  
  message() {
    if (this.peer) {
      // this.peer.send("ping!");
      this.socket.emit('chat-call', { room: this.roomId, message: { text: "heart", sender: this.caller }});
    }
  }

  sendMessage() {
    if (this.peer) {
      // this.peer.send(this.message);
      this.socket.emit('chat-call', { room: this.roomId, message: { text: "ping", sender: this.caller }});
    }
  }

  disconnect() {
    if (this.peer) {
      this.locVideo.nativeElement.srcObject = null;
      this.rtcVideo.nativeElement.pause();
      this.rtcVideo.nativeElement.srcObject = null;

      this.peer.destroy();
      this.peer = null;
      this.targetpeer = null;
      this.init();
    }
  }

  showSmile() {
    this.smileShow = true;
    this.timeOut = setTimeout(() => {
      this.smileShow = false;
    }, 5000);
  }

  showHeart() {
    this.heartShow = true;
    this.timeOut = setTimeout(() => {
      this.heartShow = false;
    }, 5000);
  }

}
