"use client";

import { IDL } from "@/utils/constant";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useEffect, useState } from "react";

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "");

export default function Demo() {
  const { connection } = useConnection();
  const wallet = useWallet();

  // state
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
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

  const loadNotes = async () => {
    if (!wallet.publicKey) return;
    setLoading(true);
    try {
      const program = getProgram();
      if (!program) return;

      const notes = await program.account.note.all([
        {
          memcmp: {
            offset: 8,
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ]);
      setNotes(notes);
      setMessage("");
    } catch (error) {
      console.error("Error loading notes:", error);
      setMessage("Failed to load notes.");
    } finally {
      setLoading(false);
    }
  };

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

  const updateNote = async () => {
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

  const deleteNote = async (note: any) => {
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
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm px-5 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">My Notes</h1>
            <WalletMultiButton />
          </div>
        </header>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="mb-4 text-xl text-gray-700">
            Please connect your wallet to start using the app
          </div>
          <WalletMultiButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-5 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">My Notes</h1>
          <WalletMultiButton />
        </div>
      </header>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
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
          <div className="mt-6">Loading your notes...</div>
        ) : (
          <div className="mt-6 space-y-4">
            {notes?.map((note: any, index: number) => {
              const noteKey = note?.publicKey?.toBase58?.();
              return (
                <div
                  className="bg-white rounded-lg shadow p-6"
                  key={`${note.account.author}-${index}`}
                >
                  <h3 className="text-xl font-bold">{note.account.title}</h3>
                  <p className="text-gray-600 mt-2">{note.account.content}</p>
                  <div className="text-sm text-gray-500 mt-4">
                    Created:{" "}
                    {new Date(
                      note.account.createdAt.toNumber()
                    ).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Last updated:{" "}
                    {new Date(
                      note.account.lastUpdated.toNumber()
                    ).toLocaleString()}
                  </div>
                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={() => {
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
                      className="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteNote(note)}
                      disabled={deleteLoading === noteKey}
                      className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
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
    </div>
  );
}
