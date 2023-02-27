import * as React from "react";
import { render } from "react-dom";
import Toolbar, { InsertButton } from "./toolbar";
import { PluginToUIMessage } from "./pluginMessage";

import test1 from "./test-insert/test-1.json";
import test2 from "./test-insert/test-2.json";
import test3 from "./test-insert/test-3.json";
import test4 from "./test-insert/test-4.json";
import test5 from "./test-insert/test-5.json";
import test6 from "./test-insert/test-6.json";
import test7 from "./test-insert/test-7.json";

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

  insertTestCases = () => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "insertTestCases",
          // Add your own, local figma-json files here.
          data: [test1, test2, test3, test4, test5, test6, test7]
        }
      },
      "*"
    );
  };

  onInsert = (e: React.MouseEvent) => {
    console.log("asked to insert");
    this.setState({ showInsert: true });
  };

  logDefaults = () => {
    parent.postMessage({ pluginMessage: { type: "logDefaults" } }, "*");
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
              onClick={this.insertTestCases}
              style={{ userSelect: "none" }}
            >
              Insert test cases
            </button>
            <button onClick={this.logDefaults} style={{ userSelect: "none" }}>
              Log defaults
            </button>
          </Toolbar>
          <pre style={{ flex: 1, overflowY: "auto" }}>
            {JSON.stringify(
              dump,
              (key: string, value: any) =>
                value instanceof Uint8Array ? `<${value.length} bytes>` : value,
              2
            )}
          </pre>
          {/* <ReactJson src={dump} name={null} /> */}
        </div>
      );
    }
  }
}

const elem = document.getElementById("react-page");

render(<UI />, elem);
