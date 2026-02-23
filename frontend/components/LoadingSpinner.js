export default function LoadingSpinner({ size = 'lg' }) {
  return (
    <div className="flex items-center justify-center py-12">
      <span className={`loading loading-spinner loading-${size} text-primary`}></span>
    </div>
  );
}
