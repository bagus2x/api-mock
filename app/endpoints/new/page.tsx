import EndpointForm from "@/components/EndpointForm";

export default function NewEndpointPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Tambah endpoint baru</h1>
        <p className="text-sm text-muted mt-0.5">
          Definisikan path, method, parameter, dan payload untuk endpoint mock ini.
        </p>
      </div>
      <EndpointForm />
    </div>
  );
}
