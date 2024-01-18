import { useEffect } from "react";

export const Redirect = ({ to }: { to: string }) => {
  useEffect(() => {
    window.location.href = to;
  }, []);

  return (
    <div>
      <div>
        This page has moved, <a href={to}>continue to the new location</a>.
      </div>
    </div>
  );
};
