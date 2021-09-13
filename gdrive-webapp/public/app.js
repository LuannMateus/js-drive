import AppController from './src/appController.js';
import ConnectionManger from './src/connectionManager.js';
import ViewManager from './src/presentation/viewManager.js';
import DragAndDropManager from './src/presentation/dragAndDropManager.js';

const API_URL = 'https://0.0.0.0:3000';

const appController = new AppController({
  viewManager: new ViewManager(),
  dragAndDropManager: new DragAndDropManager(),
  connectionManager: new ConnectionManger({
    apiUrl: API_URL,
  }),
});

try {
  await appController.initialize();
} catch (error) {
  console.error('Error on initializing', error);
}
