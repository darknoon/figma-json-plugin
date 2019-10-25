import * as React from "react";

const doNothing = (e: React.MouseEvent) => {
  console.log("No event hooked up!");
};

const Toolbar = ({ onInsert = doNothing }) => (
  <div
    style={{
      background: "white",
      borderBottom: "1px solid grey",
      height: 32
    }}
  >
    <button onClick={onInsert}>
      Insert
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
        <path d="M0 0h24v24H0z" fill="none" />
      </svg>
    </button>
    More text
  </div>
);

export default Toolbar;
