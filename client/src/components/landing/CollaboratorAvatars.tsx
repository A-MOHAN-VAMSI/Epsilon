const collaborators = [{ name: "Alice", color: "bg-emerald-500" }, { name: "Bob", color: "bg-blue-500" }, { name: "Emma", color: "bg-violet-500" }];

export default function CollaboratorAvatars() {
  return <div className="absolute right-4 top-3 z-10 flex items-center -space-x-2">{collaborators.map((user) => <div key={user.name} title={`${user.name} is online`} className={`relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0B1018] text-[10px] font-semibold text-white shadow-lg transition-transform hover:z-10 hover:-translate-y-0.5 ${user.color}`}><span>{user.name.charAt(0)}</span><span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 animate-pulse rounded-full border border-[#0B1018] bg-[var(--color-primary)]" /></div>)}</div>;
}
