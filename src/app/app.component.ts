import { Component } from '@angular/core';
import { Platform, AlertController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { Socket } from 'ng-socket-io';
import { Push, PushObject, PushOptions } from '@ionic-native/push';

import { HomePage } from '../pages/home/home';
import { HttpClient } from '@angular/common/http';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = HomePage;

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    socket: Socket,
    localNotifications: LocalNotifications,
    private push: Push,
    private alrtCtrl: AlertController,
    private http: HttpClient
  ) {
    platform.ready().then(() => {
      if (platform.is("android")) {
        statusBar.backgroundColorByHexString("#803b3737");
      }

      socket.on('start-call', (data) => {
        let peer:any = data;
        if (peer.data.type === 'offer') {
          if (platform.is('cordova')) {
            // Schedule a single notification
            localNotifications.schedule({
              id: 1,
              text: 'Incomming call',
              foreground: false,
              lockscreen: true,
              badge: 1,
              // sound: isAndroid? 'file://sound.mp3': 'file://beep.caf',
              data: { secret: "key" }
            });
            localNotifications.on('click').subscribe((data) => {
              console.log(data);
            });
          }
        }
      });
      if (platform.is('cordova')) this.startPush();
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      // statusBar.styleDefault(); // dark mode
      splashScreen.hide();

      platform.resume.subscribe(() => {
        // TODO: reconnect socket
      });

    });
  }

  startPush() {
    // PUSH
    this.push.hasPermission()
    .then((res: any) => {
      console.log(res)
      if (res.isEnabled) {
        console.log('We have permission to send push notifications');
      } else {
        console.log('We do not have permission to send push notifications');
      }
    });

    // this.push.createChannel({
    //   id: "videocall",
    //   description: "Video Call Channel",
    //   // The importance property goes from 1 = Lowest, 2 = Low, 3 = Normal, 4 = High and 5 = Highest.
    //   importance: 4
    // }).then(() => console.log('Channel created'));
    // Delete a channel (Android O and above)
    // this.push.deleteChannel('video-call').then(() => console.log('Channel deleted'));
    // Return a list of currently configured channels
    // this.push.listChannels().then((channels) => console.log('List of channels', channels));

    const options: PushOptions = {
      android: {
        senderID: '929651249469',
        sound: 'true',
        vibrate: true,
        forceShow: "1",
        topics: ['videocall', 'all']
      },
      ios: {
        alert: 'true',
        badge: true,
        sound: 'false'
      },
      windows: {},
      browser: {
        pushServiceURL: 'http://push.api.phonegap.com/v1/push'
      }
    };

    const pushObject: PushObject = this.push.init(options);

    pushObject.on('notification').subscribe((notification: any) => {
      console.log('Received a notification', notification);
      if (notification.additionalData.foreground) {
        let confirmAlert = this.alrtCtrl.create({
          title: notification.title, // notification.additionalData.userId
          message: notification.message,
          buttons: [{
            text: 'Tutup',
            role: 'cancel'
          }, {
            text: 'Ok',
            handler: () => {
              // this.nav.push(HomePage, { message: notification.additionalData.dichVuID });
            }
          }]
        });
        confirmAlert.present();
      }
    });
    pushObject.on('registration').subscribe((registration: any) => {
      // console.log('registrationId:', registration.registrationId);
      // console.log('registrationType:', registration.registrationType);
      // console.log('Device registered', registration);
      this.sendotification(registration.registrationId);
    });
    pushObject.on('error').subscribe(error => console.error('Error with Push plugin', error));
  }

  sendotification(token) {
    let headers = { 'Content-Type': 'application/json' };
    let body = { userId: "1", token: token };
    this.http.post('http://192.168.1.200:8080/room/push', JSON.stringify(body), { headers: headers })
    .subscribe(data => {
      console.log(data);
    });
  }

}

