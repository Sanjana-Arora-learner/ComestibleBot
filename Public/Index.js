import React from "react";
import ReactDOM from "react-dom";
import App from "./App.js";
import {Route, BrowserRouter} from 'react-router-dom';
ReactDOM.render(<BrowserRouter><Route path="/" component={App}></Route></BrowserRouter> , document.getElementById("root"));