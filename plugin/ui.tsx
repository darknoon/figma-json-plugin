import * as React from "react";
import { render } from "react-dom";
import ReactJson from "react-json-view";

interface UIState {
  dump?: any;
}

console.log("Starting plugin");
// declare global onmessage = store.update;

class UI extends React.Component {
  state: UIState = {};

  onMessage = (e: MessageEvent) => {
    console.log("on message", e);
    const {
      data: {
        pluginMessage: { dump }
      }
    } = e;
    this.setState({ dump });
  };

  componentDidMount() {
    console.log("Did mount");
    parent.postMessage({ pluginMessage: { type: "ready" } }, "*");
    window.addEventListener("message", this.onMessage);
  }

  render() {
    const { dump } = this.state;
    if (dump === undefined) {
      return <p>Waiting for data...</p>;
    } else {
      const {
        objects: [first]
      } = dump;
      return <ReactJson src={first} name={null} />;
    }
  }
}

const elem = document.getElementById("react-page");

render(<UI />, elem);
