export const ProgressCard = () => {
  return (
    <section className="rounded-[1.75rem] bg-white p-6 shadow-[0_20px_60px_rgba(11,20,55,0.08)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#A3AED0]">Implementation progress</p>
          <h2 className="mt-1 text-xl font-bold text-[#2B3674]">Platform setup</h2>
        </div>
        <div className="text-sm font-semibold text-emerald-600">JWT ready</div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-[#707EAE]">Authentication</span>
            <span className="font-semibold text-[#2B3674]">100%</span>
          </div>
          <div className="h-2 rounded-full bg-[#EEF2FF]">
            <div className="h-2 w-full rounded-full bg-[#4318FF]" />
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-[#707EAE]">Customer module</span>
            <span className="font-semibold text-[#2B3674]">20%</span>
          </div>
          <div className="h-2 rounded-full bg-[#EEF2FF]">
            <div className="h-2 w-1/5 rounded-full bg-[#7551FF]" />
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-[#707EAE]">Job scheduling</span>
            <span className="font-semibold text-[#2B3674]">10%</span>
          </div>
          <div className="h-2 rounded-full bg-[#EEF2FF]">
            <div className="h-2 w-[10%] rounded-full bg-[#05CD99]" />
          </div>
        </div>
      </div>
    </section>
  );
};
