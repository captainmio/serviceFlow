import notFoundIllustration from "../assets/not-found-illustration.png";

export const NotFoundPage = () => {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F4F7FE_0%,#EEF2FF_100%)] px-6 py-8 text-[#1B2559]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <section className="w-full rounded-[2rem] bg-white p-8 text-center shadow-[0_20px_60px_rgba(11,20,55,0.08)] sm:p-12">
          <div className="mx-auto w-full max-w-[24rem]">
            <img
              src={notFoundIllustration}
              alt="Illustration of a browser path that does not exist"
              className="h-1/2 w-full"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[#2B3674] sm:text-5xl">
            This page doesn&apos;t exist.
          </h1>
          <p className="mt-4 text-base leading-7 text-[#707EAE]">
            The URL you entered doesn&apos;t match a route in ServiceFlow. You can head back to a
            working page and keep going.
          </p>
        </section>
      </div>
    </main>
  );
};
