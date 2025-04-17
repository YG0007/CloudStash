// SharedFilePage.tsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { File } from "@shared/schema"; // or your actual type

export default function SharedFilePage() {
  const { id, name } = useParams<{ id: string; name: string }>();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/files/${id}`)
      .then(res => res.ok ? res.json() : Promise.reject("Not found"))
      .then(data => setFile(data))
      .catch(() => setFile(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!file) return <p>File not found or no longer shared.</p>;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-4">{file.name}</h1>
      <p className="text-sm text-gray-600">Type: {file.type}</p>
      <a
        href={`/api/files/${file.id}/download`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Download
      </a>
    </div>
  );
}
