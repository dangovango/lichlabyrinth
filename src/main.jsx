import React from 'react';
import ReactDOM from 'react-dom/client';
import RootComponent from './App.jsx';

function init() {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        console.error("Root element not found!");
        return;
    }
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <RootComponent />
        </React.StrictMode>
    );
}

init();