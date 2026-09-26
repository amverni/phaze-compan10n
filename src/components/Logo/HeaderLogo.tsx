import { Logo } from "./Logo";

export function HeaderLogo() {
  return (
    <div className="card-header-logo absolute inset-x-0 top-0 flex items-center justify-center">
      <Logo height={100} width="100%" fitToContainer />
    </div>
  );
}
