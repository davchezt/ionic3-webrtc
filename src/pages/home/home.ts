import { Component, ViewChild } from '@angular/core';
import { NavController, Platform, AlertController } from 'ionic-angular';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Socket } from 'ng-socket-io';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import { LocalNotifications } from '@ionic-native/local-notifications';

declare var SimplePeer: any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class HomePage {
  @ViewChild('rtcVideo') rtcVideo;
  @ViewChild('locVideo') locVideo;

  cameraStream: any;
  userDevices:any = [];
  useAudio: boolean = true;
  isMuted: boolean = false;
  videoConstraints: any;
  targetPeer: any;
  peer: any;
  n = <any>navigator;
  isCaller: boolean = false;
  isConnected: boolean = false;
  isInit: boolean = false;
  roomId = "vidoe-call";
  smileShow: boolean = false;
  heartShow: boolean = false;
  timeOut: any;
  timeInterval: any;
  timeCounter: any;
  timeClock: any;
  h:number = 0;
  m:number = 0;
  s:number = 0;

  constructor(
    public navCtrl: NavController,
    public socket: Socket, 
    private androidPermissions: AndroidPermissions,
    private platform: Platform,
    private camera: Camera,
    private localNotifications: LocalNotifications,
    private alrtCtrl: AlertController
  ) {
    // window.addEventListener('pause', () => {
    //   console.log('app:pause');
    //   this.socket.emit('stop-call');
    // }, false);
    // window.addEventListener('resume', () => {
    //   console.log("app:resume");
    //   this.socket.emit('stop-call');
    // }, false);
    Observable.fromEvent(window, 'beforeunload').subscribe(event => {
      if (this.peer) this.disconnect();
    });
    this.videoConstraints = {
      video: true,
      audio: this.useAudio
    }
  }

  ionViewDidLoad() {
    this.startAnu();
    this.timeNow();
    if (this.platform.is('cordova')) {
      this.platform.ready().then(() => {
        this.checkPermissions();
        // this.initScheduleNotifications();
        // this.openCamera();
        this.listCamera();
      });
    }
  }

  listCamera() {
    this.n.mediaDevices.enumerateDevices()
    .then((devices) => {
      devices.forEach((device) => {
        console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
        if (device.kind === 'videoinput') {
          if (this.userDevices.length === 0) {
            this.userDevices.push(device.deviceId);
          }
          else {
            Object.keys(this.userDevices).forEach(() => {
              if (this.userDevices.indexOf(device.deviceId) === -1) this.userDevices.push(device.deviceId);
            });
          }
        }
      });
    })
    .catch((e) => {
      console.log(e.name + ": " + e.message);
    });
  }

  initWebRTC() {
    this.isInit = true;
    const handleSuccess = (stream: MediaStream) => {
      (<any>window).stream = stream; // make stream available to browser console
      this.locVideo.nativeElement.srcObject = stream;
      this.locVideo.nativeElement.muted = true;
      this.locVideo.nativeElement.play();
    };
    const handleError = (error: any) => {
      console.log('navigator.getUserMedia error: ' + error.name + ', ' + error.message);
    };
    this.n.mediaDevices.getUserMedia(this.videoConstraints).then(handleSuccess).catch(handleError);
  }

  stopWebRTC() {
    this.isInit = false;
    if (this.cameraStream) {
      this.cameraStream.getVideoTracks().forEach((track) => {
        track.stop();
      });
      this.cameraStream.getAudioTracks().forEach((track) => {
        track.stop();
      });
    }
    this.socket.emit('stop-call', { room: this.roomId });
  }

  openCamera() {
    const options: CameraOptions = {
      quality: 75, // 100 = crash, 50 default
      destinationType: this.camera.DestinationType.DATA_URL, // FILE_URI || DATA_URL
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    }
    
    this.camera.getPicture(options).then((imageData) => {
      console.log(imageData);
    }, (err) => {
      console.log(err);
    });
  }

  notify() {
    let notification = {
      id: 1,
      title: "Testing",
      text: "Ngetest Doang",
      at: new Date(new Date().getTime() + 30000),
      forceShow: 'true',
      coldstart: false,
      foreground: true
    };
    this.localNotifications.schedule(notification);
  }

  initScheduleNotifications() {
    const notificationId = 42;
    const scheduleTime = 60 * 1000 * 5;
    this.localNotifications.isScheduled(notificationId).then(
    isScheduled => {
      if (isScheduled ) {
        this.localNotifications.update({
          id: notificationId,
          trigger: { at: new Date(new Date().getTime() + scheduleTime) }
        });
      } else {
        this.localNotifications.schedule({
          id: notificationId,
          text: 'Come back !',
          trigger: { at: new Date(new Date().getTime() + scheduleTime) }
        });
      }
    });
    // eventName	string	The name of the event. Available events: schedule, trigger, click, update, clear, clearall, cancel, cancelall. Custom event names are possible for actions
    this.localNotifications.on('click').subscribe((data) => {
      console.log(data);
    });
  }

  startAnu() {
    // this.isCaller = location.hash === '#call';
    this.socket.connect();
    this.socket.emit('subscribe', this.roomId);
    this.socket.on('start-call', (data) => {
      let peer:any = data;
      if (peer.data.type === 'offer') {
        if (!this.isCaller) {
          console.log('offer:', peer.data);
          this.init();
          this.targetPeer = JSON.stringify(peer.data);
        }
      }
      else {
        if (this.isCaller) {
          console.log('answer:', peer.data);
          this.targetPeer = JSON.stringify(peer.data);
          if (this.peer) {
            this.peer.signal(JSON.parse(this.targetPeer));
          }
        }
      }
    })
    this.socket.on('in-call', (data) => {
      console.log('in-call')
      this.isConnected = true;
      this.isInit = false;
      this.startTimer();
    });
    this.socket.on('chat-call', (data) => {
      let peer:any = data;
      console.log(peer.message);
      if (this.isCaller) {
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
      this.disconnect();
      this.stropTimer();
      console.log('stop-call');
    });
  }

  checkPermissions() {
    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.CAMERA)
    .then(
      success => console.log("Hey you have permission"),
      err => {
        console.log("Uh oh, looks like you don't have permission");
        this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA);
      }
    );
    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO)
    .then(
      success => console.log("Hey you have permission"),
      err => {
        console.log("Uh oh, looks like you don't have permission");
        this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.RECORD_AUDIO);
      }
    );
    this.androidPermissions.requestPermissions([
      this.androidPermissions.PERMISSION.CAMERA,
      this.androidPermissions.PERMISSION.RECORD_AUDIO
    ]);
  }

  switcCamera() {
    if (this.userDevices.length < 2) return;
  }

  init() {
    this.isInit = true;
    this.n.getUserMedia = (this.n.getUserMedia || this.n.webkitGetUserMedia || this.n.mozGetUserMedia || this.n.msGetUserMedia);
    // front { facingMode: { exact: 'user' } }
    // back { facingMode: { exact: 'environment' } }
    const configs = {
      video: true,
      audio: this.useAudio
    };
    this.n.getUserMedia(configs, (stream: MediaStream) => {
      (<any>window).stream = stream;
      this.cameraStream = stream;
      if (!this.locVideo.nativeElement.srcObject) this.locVideo.nativeElement.srcObject = this.cameraStream;
      this.locVideo.nativeElement.volume = 1;
      this.locVideo.nativeElement.muted = true;
      this.locVideo.nativeElement.play();
      this.peer = new SimplePeer({
        initiator: this.isCaller,
        trickle: false,
        stream: this.cameraStream,
        iceTransportPolicy: "relay",
        config: {
          iceServers: [
            // { urls: 'stun:stun.l.google.com:19302' },
            // { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
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
      
      // this.peer.on('data', (data) => {
      //   console.log('Recieved message:' + data);
      // });
      
      this.peer.on('stream', (streams) => {
        this.rtcVideo.nativeElement.srcObject = streams;
        this.rtcVideo.nativeElement.play();
      });

      this.peer.on('close', () => {
        console.log("peer close");
        this.socket.emit('stop-call', { room: this.roomId });
        // Stream Video
        stream.getVideoTracks().forEach(function(track) {
          track.stop();
        });
        stream.getAudioTracks().forEach(function(track) {
          track.stop();
        });
        // Local video
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

  toggleAudio() {
    this.isMuted = !this.isMuted;
    this.cameraStream.getAudioTracks()[0].enabled = !this.isMuted;
  }

  connect() {
    if (this.peer) {
      this.peer.signal(JSON.parse(this.targetPeer));
    }
  }
  
  message() {
    if (this.peer) {
      this.socket.emit('chat-call', { room: this.roomId, message: { text: "heart", sender: this.isCaller }});
    }
  }

  sendMessage() {
    if (this.peer) {
      this.socket.emit('chat-call', { room: this.roomId, message: { text: "ping", sender: this.isCaller }});
    }
  }

  disconnect() {
    if (this.peer) {
      this.locVideo.nativeElement.srcObject = null;
      this.rtcVideo.nativeElement.pause();
      this.rtcVideo.nativeElement.srcObject = null;

      this.peer.destroy();
      this.peer = null;
      this.targetPeer = null;
      // this.init();
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

  startTimer() {
    if (this.timeInterval) return;
    this.timeInterval = setInterval(() => {
      this.s++;
      if (this.s >= 60) {
        this.s = 0; this.m++;
      }
      if (this.m >= 60) {
        this.m = 0; this.h++;
      }
      let dm = this.m < 10 ? "0" + this.m:this.m;
      let ds = this.s < 10 ? "0" + this.s:this.s;
      this.timeCounter = this.h + ":" + dm + ":" + ds;
    }, 1000);
  }

  stropTimer() {
    this.timeCounter = null;
    this.h = 0;
    this.m = 0;
    this.s = 0;
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
      this.timeInterval = null;
    }
  }

  timeNow() {
    setInterval(() => {
      let date = new Date();
      let time = date.getTime() / 1000;
      this.timeClock = this.getHHMM(time);
    }, 1000);
  }


  getHHMM = (t: number) => {
    let d = new Date(t * 1000);
    let h = d.getHours();
    let m = d.getMinutes();
    let s = d.getSeconds();
    let a = "";
    let ms = "";
    let ss = "";
    if (h > 0 && h < 12) {
      a = "AM";
    } else {
      if (h == 0) a = "AM";
      else a = "PM";
    }
    if (m < 10) ms = "0" + m;
    else ms = "" + m;
    if (s < 10) ss = "0" + s;
    else ss = "" + s;
    return (h == 0 || h == 12 ? 12 : h % 12) + ":" + ms + ":" + ss + " " + a;
  };

}
