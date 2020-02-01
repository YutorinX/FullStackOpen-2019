import React from "react";

const NoteForm = ({ onSubmit, handleChange, value }) => (
  <form onSubmit={onSubmit}>
    <input value={value} onChange={handleChange} />
    <button type="submit">save</button>
  </form>
);

export default NoteForm;
