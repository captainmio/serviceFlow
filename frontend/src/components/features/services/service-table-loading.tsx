export const ServiceTableLoading = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-28 animate-pulse rounded-full bg-[#E9EDF7]" />
          <div className="mt-3 h-6 w-56 animate-pulse rounded-full bg-[#E9EDF7]" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-full bg-[#E9EDF7]" />
      </div>

      <div className="overflow-hidden rounded-[1.5rem] bg-[#F8FAFF] p-4">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 15 }).map((_, index) => (
            <div
              key={index}
              className="h-11 animate-pulse rounded-2xl bg-[linear-gradient(90deg,#E9EDF7_0%,#F8FAFF_50%,#E9EDF7_100%)] bg-[length:200%_100%] [animation:shimmer_1.5s_infinite]"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
