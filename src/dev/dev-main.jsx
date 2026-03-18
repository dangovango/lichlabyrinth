import React from 'react';
import { createRoot } from 'react-dom/client';
import QuestEditor from './QuestEditor.jsx';
import '../../style.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QuestEditor />
  </React.StrictMode>
);