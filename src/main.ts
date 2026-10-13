import './style.css';
import {BrowserAdapter} from './platform/browser';
import {startGame} from './bootstrap';
await startGame(new BrowserAdapter());
