"use client";

import { IDL } from "@/utils/constant";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useEffect, useState } from "react";

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [notes, setNotes] = useState<any[]>([]);
  // loading is kept for fetch/load UI; actions have their own flags so they don't conflict
  const [loading, setLoading] = useState(false);
  // per-action loading flags (renamed for clarity)
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  // store the publicKey (base58) of the note being deleted or null
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  // When set, we are editing this note and reuse the top title/content inputs
  const [editingNote, setEditingNote] = useState<any | null>(null);

  const getProgram = () => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    const provider = new AnchorProvider(connection, wallet as any, {});
    return new Program(IDL as any, PROGRAM_ID, provider);
  };

  const getNoteAddress = (title: string) => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    const [noteAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("note"), wallet.publicKey.toBuffer(), Buffer.from(title)],
      PROGRAM_ID
    );
    return noteAddress;
  };

  // Load notes
  const loadNotes = async () => {
    if (!wallet.publicKey) return;

    setLoading(true);
    try {
      const program = getProgram();
      if (!program) return;

      const notes = await program.account.note.all([
        {
          memcmp: {
            offset: 8, // Discriminator size account: Note: {author, title, con....}
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ]);

      console.log("Loaded notes:", notes);
      setNotes(notes);
      setMessage("");
    } catch (error) {
      console.error("Error loading notes:", error);
      setMessage("Failed to load notes.");
    } finally {
      setLoading(false);
    }
  };

  //create notes
  const createNote = async (title: string, content: string) => {
    if (!title.trim() || !content.trim()) {
      setMessage("Title and content cannot be empty.");
      return;
    }
    if (title.length > 100) {
      setMessage("Title cannot be longer than 100 chars");
      return;
    }
    if (content.length > 1000) {
      setMessage("Content cannot be longer than 1000 chars");
      return;
    }

    setCreateLoading(true);
    try {
      const program = getProgram();
      if (!program) return;

      const noteAddress = getNoteAddress(title);
      if (!noteAddress) return;

      await program.methods
        .createNote(title, content)
        .accounts({
          note: noteAddress,
          author: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Note created with title:", title);
      setMessage("Note created successfully.");
      setTitle("");
      setContent("");
      await loadNotes();
    } catch (error) {
      console.error("Error creating note:", error);
      setMessage("Failed to create note.");
    } finally {
      setCreateLoading(false);
    }
  };

  // update notes
  const updateNote = async () => {
    // editingNote must be set and we reuse the top `content` input as the new content
    if (!editingNote) return;
    if (!content.trim()) {
      setMessage("Content cannot be empty.");
      return;
    }
    if (content.length > 1000) {
      setMessage("Content cannot be longer than 1000 chars");
      return;
    }

    setUpdateLoading(true);
    try {
      const program = getProgram();
      if (!program) return;

      const noteAddress = getNoteAddress(editingNote.account.title);
      if (!noteAddress) return;

      await program.methods
        .updateNote(content)
        .accounts({
          note: noteAddress,
          author: wallet.publicKey,
        })
        .rpc();

      setMessage("Note updated successfully.");
      setEditingNote(null);
      setTitle("");
      setContent("");
      await loadNotes();
    } catch (error) {
      console.error("Error updating note:", error);
      setMessage("Failed to update note.");
    } finally {
      setUpdateLoading(false);
    }
  };
  // delete notes

  const deleteNote = async (note: any) => {
    // mark this specific note as deleting so other UI actions aren't mistaken for deleting
    const noteKey = note?.publicKey?.toBase58?.() ?? null;
    setDeleteLoading(noteKey);
    try {
      const program = getProgram();
      if (!program) return;

      const noteAddress = getNoteAddress(note.account.title);
      if (!noteAddress) return;

      await program.methods
        .deleteNote()
        .accounts({
          note: noteAddress,
          author: wallet.publicKey,
        })
        .rpc();
      setMessage("Note deleted successfully.");
      await loadNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      setMessage("Error to delete note.");
    } finally {
      setDeleteLoading(null);
    }
  };

  useEffect(() => {
    if (wallet.connected) {
      loadNotes();
    }
  }, [wallet.connected]);

  if (!wallet.connected) {
    return (
      <div className="text-gray-700">
        {" "}
        Wallet not connected please connect your wallet
      </div>
    );
  }

  console.log("Rendering notes:", notes, notes?.length);
  return (
    <div className="text-gray-700 p-4">
      <div className="mb-6">
        <h2 className="text-2xl mb-6">Create new Note</h2>
        <div className="mb-4">
          <label htmlFor="note-title" className="text-sm block font-medium">
            Title ({title.length}/100)
          </label>
          <input
            id="note-title"
            type="text"
            name="title"
            value={title}
            placeholder="Title here.."
            onChange={(e) => setTitle(e.target.value)}
            readOnly={!!editingNote}
            className="border border-gray-300 rounded-lg p-2 w-full"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="note-content" className="text-sm block font-medium">
            Content ({content.length}/1000)
          </label>
          <textarea
            maxLength={1000}
            name="content"
            value={content}
            rows={5}
            onChange={(e) => setContent(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 w-full"
            placeholder="Content here.."
          />
        </div>
        {editingNote ? (
          <div className="flex gap-4">
            <button
              onClick={() => updateNote()}
              disabled={updateLoading || !content.trim()}
              className="bg-green-500 text-white w-full rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateLoading ? "Saving..." : "Save Update"}
            </button>
            <button
              onClick={() => {
                setEditingNote(null);
                setTitle("");
                setContent("");
                setMessage("");
              }}
              disabled={updateLoading}
              className="bg-gray-300 text-black w-full rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => createNote(title, content)}
            disabled={createLoading || !title.trim() || !content.trim()}
            className="bg-blue-500 text-white w-full rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createLoading ? "Creating note..." : "Create Note"}
          </button>
        )}
      </div>
      {loading ? (
        <div>Loading your notes...</div>
      ) : (
        <div>
          {notes?.map((note: any, index: number) => {
            const noteKey = note?.publicKey?.toBase58?.();
            return (
              <div
                className="mb-6 border-2 border-gray-300 p-2 rounded-lg"
                key={`${note.account.author}-${index}`}
              >
                <h3 className="text-xl font-bold">{note.account.title}</h3>
                <p className="text-gray-600">{note.account.content}</p>
                <div className="text-sm text-gray-500">
                  Create At:{" "}
                  {new Date(note.account.createdAt.toNumber()).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  Last updated:{" "}
                  {new Date(
                    note.account.lastUpdated.toNumber()
                  ).toLocaleString()}
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => {
                      // populate top inputs and switch to edit mode
                      setEditingNote(note);
                      setTitle(note.account.title);
                      setContent(note.account.content);
                      setMessage("");
                    }}
                    disabled={
                      createLoading ||
                      updateLoading ||
                      deleteLoading === noteKey
                    }
                    className="p-2 text-white bg-green-400 rounded-lg cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteNote(note)}
                    disabled={deleteLoading === noteKey}
                    className="p-2 text-white bg-red-400 rounded-lg cursor-pointer"
                  >
                    {deleteLoading === noteKey ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
