import { formatBytes } from "@/lib/file-utils.tsx";

type StorageProgressProps = {
  used: number;
  total: number;
};

export default function StorageProgress({ used, total }: StorageProgressProps) {
  const percentage = Math.min(100, Math.round((used / total) * 100));
  
  return (
    <div className="space-y-2">
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-primary h-2.5 rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-600">
        {percentage}% of {formatBytes(total)} used
      </p>
      <button className="text-sm text-primary hover:text-blue-700">
        Upgrade Storage
      </button>
    </div>
  );
}
