// Path: packages/components/rich-text-editor/index.tsx
"use client";
import React from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[160px] border border-[#E7E5E4] rounded-2xl bg-[#FAF8F3] animate-pulse" />
  ),
});

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "link",
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
  return (
    <div className="rich-text-editor">
      <style>{`
        .rich-text-editor .ql-container {
          border-bottom-left-radius: 16px;
          border-bottom-right-radius: 16px;
          font-size: 14px;
          min-height: 160px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 16px;
          border-top-right-radius: 16px;
          background: #FAF8F3;
          transition: border-color 0.2s ease;
        }
        .rich-text-editor .ql-container, .rich-text-editor .ql-toolbar {
          border-color: #E7E5E4;
        }
        .rich-text-editor .ql-editor {
          min-height: 140px;
          color: #292524;
        }
        .rich-text-editor .ql-container:focus-within {
          outline: none;
          box-shadow: 0 0 0 2px #059669;
          border-color: #059669;
        }
        .rich-text-editor:hover .ql-toolbar,
        .rich-text-editor:hover .ql-container {
          border-color: #05966980;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
      />
    </div>
  );
};

export default RichTextEditor;
