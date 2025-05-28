import React from 'react';
import ReactDOM from 'react-dom/client';
import {UniDetect} from './components/UniDetect/UniDetect';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <UniDetect />
  </React.StrictMode>
);
