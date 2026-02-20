import { registerRootComponent } from 'expo';

// Choose which version to test:
// - './App' = Full app with lazy loading (default)
// - './App-minimal' = Minimal test (just React Native)
// - './App-debug' = Module dependency test
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
