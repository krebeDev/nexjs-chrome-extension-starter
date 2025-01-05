"use client";

import { FC } from "react";

const Popup: FC = () => {
  const sendMessage = (): void => {
    chrome.runtime.sendMessage({ message: "Hello from the popup!" });
  };

  return (
    <div className='flex flex-col items-center justify-center h-full'>
      <h1 className='text-2xl font-bold'>Hello world!</h1>
      <button
        type='button'
        onClick={sendMessage}
        className='mt-4 px-4 py-2 bg-blue-500 text-white rounded'
      >
        Send a message
      </button>
    </div>
  );
};

export default Popup;
