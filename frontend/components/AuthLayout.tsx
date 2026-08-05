import Image from "next/image";
import type { ReactNode } from "react";

type Props = {
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  heading: string;
  children: ReactNode;
};

export function AuthLayout({ imageSrc, imageWidth, imageHeight, heading, children }: Props) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream px-4 py-12">
      <Image src={imageSrc} alt="" width={imageWidth} height={imageHeight} priority />
      <h1 className="text-center font-inria-serif text-3xl font-bold leading-none text-heading sm:text-5xl">
        {heading}
      </h1>
      {children}
    </main>
  );
}
