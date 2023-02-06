import * as React from "react";
import { render } from "react-dom";
import Toolbar, { InsertButton } from "./toolbar";
import { PluginToUIMessage } from "./pluginMessage";

interface UIState {
  dump?: any;
  showInsert: boolean;
  inserting: boolean;
  recentInsertText?: string;
}

console.log("Starting plugin");
// declare global onmessage = store.update;

class InsertUI extends React.Component<{
  recentInsertText?: string;
  doInsert: (json: string) => void;
}> {
  doInsert = () => {
    if (this.textArea !== null) {
      const text = this.textArea.value;
      if (text !== null) {
        const { doInsert } = this.props;
        console.log("about to insert", text);
        doInsert(text);
      }
    }
  };

  textArea: HTMLTextAreaElement | null = null;

  render() {
    const { recentInsertText } = this.props;
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        <Toolbar>
          <button onClick={this.doInsert} style={{ userSelect: "none" }}>
            Insert
          </button>
        </Toolbar>
        <textarea
          style={{ width: "100%", flex: 1 }}
          defaultValue={recentInsertText}
          ref={(t) => (this.textArea = t)}
        />
      </div>
    );
  }
}

class UI extends React.Component {
  state: UIState = {
    dump: undefined,
    showInsert: false,
    inserting: false
  };

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
      case "updateInsertText":
        const { recentInsertText } = message;
        this.setState({ recentInsertText });
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

  doInsert = (json: string) => {
    const data = JSON.parse(json);
    if (typeof data !== "object") {
      return;
    }
    try {
      this.setState({ showInsert: false, inserting: true });
      parent.postMessage({ pluginMessage: { type: "insert", data } }, "*");
    } finally {
    }
  };

  onInsert = (e: React.MouseEvent) => {
    console.log("asked to insert");
    this.setState({ showInsert: true });
  };

  render() {
    const { dump, showInsert, inserting, recentInsertText } = this.state;
    if (inserting) {
      return <p>Inserting...</p>;
    } else if (showInsert) {
      return (
        <InsertUI
          recentInsertText={recentInsertText || JSON.stringify(dump, null, 2)}
          doInsert={this.doInsert}
        />
      );
    } else if (dump === undefined) {
      return <p>Waiting for data...</p>;
    } else {
      return (
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          <Toolbar>
            <InsertButton onInsert={this.onInsert} />
            <button
              onClick={() => {
                parent.postMessage(
                  { pluginMessage: { type: "logDefaults" } },
                  "*"
                );
              }}
            >
              Log defaults
            </button>
          </Toolbar>
          <pre style={{ flex: 1, overflowY: "auto" }}>
            {JSON.stringify(dump, null, 2)}
          </pre>
          {/* <ReactJson src={dump} name={null} /> */}
        </div>
      );
    }
  }
}

const elem = document.getElementById("react-page");

render(<UI />, elem);
