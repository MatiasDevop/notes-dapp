export const IDL = {
  version: "0.1.0",
  name: "notes_dapp",
  instructions: [
    {
      name: "createNote",
      accounts: [
        { name: "note", isMut: true, isSigner: false },
        { name: "author", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "title", type: "string" },
        { name: "content", type: "string" },
      ],
    },
    {
      name: "updateNote",
      accounts: [
        { name: "note", isMut: true, isSigner: false },
        { name: "author", isMut: false, isSigner: true },
      ],
      args: [{ name: "newContent", type: "string" }],
    },
    {
      name: "deleteNote",
      accounts: [
        { name: "note", isMut: true, isSigner: false },
        { name: "author", isMut: true, isSigner: true },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "Note",
      type: {
        kind: "struct",
        fields: [
          { name: "author", type: "publicKey" },
          { name: "title", type: "string" },
          { name: "content", type: "string" },
          { name: "createdAt", type: "i64" },
          { name: "lastUpdated", type: "i64" },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "TitleTooLong",
      msg: "The title cannot exceed 100 characters.",
    },
    {
      code: 6001,
      name: "ContentTooLong",
      msg: "The content cannot exceed 1000 characters.",
    },
    { code: 6002, name: "TitleEmpty", msg: "The title cannot be empty." },
    {
      code: 6003,
      name: "ContentEmpty",
      msg: "The content cannot be empty.",
    },
    {
      code: 6004,
      name: "Unauthorized",
      msg: "Unauthorized to perform this action.",
    },
  ],
};
