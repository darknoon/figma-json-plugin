import * as React from "react";

const doNothing = (e: React.MouseEvent) => {
  console.log("No event hooked up!");
};

export const InsertButton = ({
  onInsert,
}: {
  onInsert: (e: React.MouseEvent) => void;
}) => (
  <button onClick={onInsert} style={{ userSelect: "none" }}>
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
);

const Toolbar: React.FunctionComponent = ({ children }) => (
  <div
    style={{
      background: "white",
      borderBottom: "1px solid #eee",
      height: 32,
    }}
  >
    {children}
  </div>
);

export default Toolbar;
