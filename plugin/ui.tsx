import * as React from "react";
import { render } from "react-dom";
import ReactJson from "react-json-view";
import Toolbar from "./toolbar";
import { PluginToUIMessage } from "./pluginMessage";

interface UIState {
  dump?: any;
  showInsert: boolean;
  inserting: boolean;
}

console.log("Starting plugin");
// declare global onmessage = store.update;

class UI extends React.Component {
  state: UIState = { dump: undefined, showInsert: false, inserting: false };

  onMessage = (e: MessageEvent) => {
    console.log("on message", e);
    const {
      data: { pluginMessage }
    } = e;
    const message = pluginMessage as PluginToUIMessage;

    switch (message.type) {
      case "didInsert":
        this.setState({ inserting: false });
        return;
      case "update":
        const { data } = message;
        this.setState({ dump: data });
        return;
    }
  };

  componentDidMount() {
    console.log("Did mount");
    parent.postMessage({ pluginMessage: { type: "ready" } }, "*");
    window.addEventListener("message", this.onMessage);
  }

  doPaste = (e: React.ClipboardEvent) => {
    console.log("Did paste!");
    const str = e.clipboardData.getData("text");
    if (typeof str === "string") {
      this.doInsert(str);
      e.preventDefault();
    }
  };

  doInsert(json: string) {
    const data = JSON.parse(json);
    if (typeof data !== "object") {
      return;
    }
    try {
      this.setState({ showInsert: false, inserting: true });
      parent.postMessage({ pluginMessage: { type: "insert", data } }, "*");
    } finally {
    }
  }

  onInsert = (e: React.MouseEvent) => {
    console.log("asked to insert");
    this.setState({ showInsert: true });
  };

  render() {
    const { dump, showInsert, inserting } = this.state;
    if (inserting) {
      return <p>Inserting...</p>;
    } else if (showInsert) {
      return (
        <textarea
          style={{ width: "100%", height: "100%" }}
          onPaste={this.doPaste}
          defaultValue="press Command-V to insert"
        ></textarea>
      );
    } else if (dump === undefined) {
      return <p>Waiting for data...</p>;
    } else {
      return (
        <>
          <Toolbar onInsert={this.onInsert} />
          <ReactJson src={dump} name={null} />
        </>
      );
    }
  }
}

const elem = document.getElementById("react-page");

render(<UI />, elem);
