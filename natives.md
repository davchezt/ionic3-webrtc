## Status bar
```java
// bar
import android.os.Build;
import android.view.View;

// bar
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
    getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
}
```

```
$ ionic cordova plugin add phonegap-plugin-push
$ npm install --save @ionic-native/push@4

$ ionic cordova plugin add cordova-plugin-local-notification
$ npm install --save @ionic-native/local-notifications@4

$ ionic cordova plugin add cordova-plugin-camera
$ npm install --save @ionic-native/camera@4

$ ionic cordova plugin add cordova-plugin-android-permissions
$ npm install --save @ionic-native/android-permissions@4

$ ionic cordova plugin add ionic-plugin-deeplinks --variable URL_SCHEME=myapp --variable DEEPLINK_SCHEME=https --variable DEEPLINK_HOST=example.com --variable ANDROID_PATH_PREFIX=/
$ npm install --save @ionic-native/deeplinks@4
```
```js
import { Deeplinks } from '@ionic-native/deeplinks';

constructor(private deeplinks: Deeplinks) { }

this.deeplinks.route({
     '/about-us': AboutPage,
     '/universal-links-test': AboutPage,
     '/products/:productId': ProductPage
   }).subscribe(match => {
     // match.$route - the route we matched, which is the matched entry from the arguments to route()
     // match.$args - the args passed in the link
     // match.$link - the full link data
     console.log('Successfully matched route', match);
   }, nomatch => {
     // nomatch.$link - the full link data
     console.error('Got a deeplink that didn\'t match', nomatch);
   });
```
> Alternatively, if you're using Ionic, there's a convenience method that takes a reference to a NavController and handles the actual navigation for you:
```js
this.deeplinks.routeWithNavController(this.navController, {
  '/about-us': AboutPage,
  '/products/:productId': ProductPage
}).subscribe(match => {
    // match.$route - the route we matched, which is the matched entry from the arguments to route()
    // match.$args - the args passed in the link
    // match.$link - the full link data
    console.log('Successfully matched route', match);
  }, nomatch => {
    // nomatch.$link - the full link data
    console.error('Got a deeplink that didn\'t match', nomatch);
  });
  ```

## AUDIO RECORD and PLAY
$ ionic cordova plugin add cordova-plugin-media
$ npm install --save @ionic-native/media@4

```js
import { Media, MediaObject } from '@ionic-native/media';


constructor(private media: Media) { }


...


// Create a Media instance.  Expects path to file or url as argument
// We can optionally pass a second argument to track the status of the media

const file: MediaObject = this.media.create('file.mp3');

// to listen to plugin events:

file.onStatusUpdate.subscribe(status => console.log(status)); // fires when file status changes

file.onSuccess.subscribe(() => console.log('Action is successful'));

file.onError.subscribe(error => console.log('Error!', error));

// play the file
file.play();

// pause the file
file.pause();

// get current playback position
file.getCurrentPosition().then((position) => {
  console.log(position);
});

// get file duration
let duration = file.getDuration();
console.log(duration);

// skip to 10 seconds (expects int value in ms)
file.seekTo(10000);

// stop playing the file
file.stop();

// release the native audio resource
// Platform Quirks:
// iOS simply create a new instance and the old one will be overwritten
// Android you must call release() to destroy instances of media when you are done
file.release();



// Recording to a file
const file: MediaObject = this.media.create('path/to/file.mp3');

file.startRecord();

file.stopRecord();
```

```js
import { Media, MediaObject } from '@ionic-native/media';
import { File } from '@ionic-native/file';

...

constructor(private media: Media, private file: File) { }

...

this.file.createFile(this.file.tempDirectory, 'my_file.m4a', true).then(() => {
  let file = this.media.create(this.file.tempDirectory.replace(/^file:\/\//, '') + 'my_file.m4a');
  file.startRecord();
  window.setTimeout(() => file.stopRecord(), 10000);
});

play()
pause()
stop()
release()
```
$ ionic cordova plugin add cordova-plugin-nativeaudio
$ npm install --save @ionic-native/native-audio@4

```js
import { NativeAudio } from '@ionic-native/native-audio';

constructor(private nativeAudio: NativeAudio) { }

...

this.nativeAudio.preloadSimple('uniqueId1', 'path/to/file.mp3').then(onSuccess, onError);
this.nativeAudio.preloadComplex('uniqueId2', 'path/to/file2.mp3', 1, 1, 0).then(onSuccess, onError);

this.nativeAudio.play('uniqueId1').then(onSuccess, onError);

// can optionally pass a callback to be called when the file is done playing
this.nativeAudio.play('uniqueId1', () => console.log('uniqueId1 is done playing'));

this.nativeAudio.loop('uniqueId2').then(onSuccess, onError);

this.nativeAudio.setVolumeForComplexAsset('uniqueId2', 0.6).then(onSuccess,onError);

this.nativeAudio.stop('uniqueId1').then(onSuccess,onError);

this.nativeAudio.unload('uniqueId1').then(onSuccess,onError);
```

$ ionic cordova plugin add cordova-plugin-badge
$ npm install --save @ionic-native/badge@4
```js
mport { Badge } from '@ionic-native/badge';

constructor(private badge: Badge) { }

...

this.badge.set(10);
this.badge.increase(1);
this.badge.clear();
```

$ ionic cordova plugin add cordova-plugin-fcm-with-dependecy-updated
$ npm install --save @ionic-native/fcm@4
```js
import { FCM } from '@ionic-native/fcm';

constructor(private fcm: FCM) {}

...

this.fcm.subscribeToTopic('marketing');

this.fcm.getToken().then(token => {
  backend.registerToken(token);
});

this.fcm.onNotification().subscribe(data => {
  if(data.wasTapped){
    console.log("Received in background");
  } else {
    console.log("Received in foreground");
  };
});

this.fcm.onTokenRefresh().subscribe(token => {
  backend.registerToken(token);
});

this.fcm.unsubscribeFromTopic('marketing');
```

# background mode fix

$ ionic cordova plugin add cordova-plugin-background-mode
$ npm install --save @ionic-native/background-mode@4

$ ionic cordova plugin remove cordova-plugin-background-mode
$ npm uninstall @ionic-native/background-mode@4
```js
import { BackgroundMode } from '@ionic-native/background-mode';

constructor(private backgroundMode: BackgroundMode) { }

...

this.backgroundMode.enable();
```

Below changes in the cordova-plugin-background-mode worked for me. Crash issue is resolved as well as background plugin is working fine.

1. In ForegroundService.java made below changes:
   a) Add below import statement:
   `import android.app.NotificationChannel;`
   b) Add below global variables:

```java
public static final String NOTIFICATION_CHANNEL_ID_SERVICE = "de.appplant.cordova.plugin.background";
public static final String NOTIFICATION_CHANNEL_ID_INFO = "com.package.download_info";
```
c) Replace keepAwake() method with below code:

```java
private void keepAwake() {
  JSONObject settings = BackgroundMode.getSettings();
  boolean isSilent    = settings.optBoolean("silent", false);
  if (!isSilent) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        nm.createNotificationChannel(new NotificationChannel(NOTIFICATION_CHANNEL_ID_SERVICE, "App Service", NotificationManager.IMPORTANCE_DEFAULT));
        nm.createNotificationChannel(new NotificationChannel(NOTIFICATION_CHANNEL_ID_INFO, "Download Info", NotificationManager.IMPORTANCE_DEFAULT));
      } else {
        startForeground(NOTIFICATION_ID, makeNotification());
      }
  }

  PowerManager powerMgr = (PowerManager);
  getSystemService(POWER_SERVICE);
  wakeLock = powerMgr.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "BackgroundMode");
  wakeLock.acquire();
} 
```
1. Add below in AndroidManifest.xml file:
   `<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />`
2. In code where I invoked background mode plugin, used disableWebViewOptimizations option on activate:

```js
cordova.plugins.backgroundMode.on('activate', function() {
  cordova.plugins.backgroundMode.disableWebViewOptimizations();
});
```

$ ionic cordova plugin add cordova-plugin-network-information
$ npm install --save @ionic-native/network@4

```js
import { Network } from '@ionic-native/network';

constructor(private network: Network) { }

...

// watch network for a disconnection
let disconnectSubscription = this.network.onDisconnect().subscribe(() => {
  console.log('network was disconnected :-(');
});

// stop disconnect watch
disconnectSubscription.unsubscribe();


// watch network for a connection
let connectSubscription = this.network.onConnect().subscribe(() => {
  console.log('network connected!');
  // We just got a connection but we need to wait briefly
   // before we determine the connection type. Might need to wait.
  // prior to doing any api requests as well.
  setTimeout(() => {
    if (this.network.type === 'wifi') {
      console.log('we got a wifi connection, woohoo!');
    }
  }, 3000);
});

// stop connect watch
connectSubscription.unsubscribe();
```