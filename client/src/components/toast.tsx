import { FC, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

type TypeToast = "error" | "success" | "warning" | "info";

interface ToastProps {
  color: string;
  message: string;
  type: TypeToast;
}

const ToastComp: FC<ToastProps> = ({ color, message, type }) => {
  console.log(color);
  console.log(message);
  console.log(type);

  useEffect(() => {
    notify(message);
  }, []);
  const notify = (msg: string) => toast.success(msg);

  return (
    <div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default ToastComp;
