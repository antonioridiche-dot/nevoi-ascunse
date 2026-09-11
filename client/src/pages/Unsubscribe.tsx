import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Unsubscribe() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const mutation = trpc.unsubscribe.process.useMutation({ onSuccess: () => setDone(true) });

  if (done) {
    return (
      <div className="min-h-screen bg-[#f0f3f8] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-[#1b2d4f] mb-4">Te-ai dezabonat cu succes</h1>
          <p className="text-[#64748b]">Nu vei mai primi emailuri de la noi.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f3f8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-[#1b2d4f] mb-4 text-center">Dezabonare</h1>
        <p className="text-[#64748b] mb-6 text-center">Introdu adresa de email pentru a te dezabona de la comunicările noastre.</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="adresa@email.com"
          className="w-full p-4 border-2 border-[#dde3ef] rounded-xl mb-4 outline-none focus:border-[#1b2d4f]"
        />
        <button
          onClick={() => email && mutation.mutate({ email })}
          disabled={!email || mutation.isPending}
          className="w-full bg-[#1b2d4f] text-white font-bold py-3 px-6 rounded-full disabled:opacity-50"
        >
          {mutation.isPending ? "Se procesează..." : "DEZABONEAZĂ-MĂ"}
        </button>
      </div>
    </div>
  );
}
