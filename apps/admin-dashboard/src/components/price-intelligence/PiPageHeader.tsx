'use client';

type PiPageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export default function PiPageHeader({ title, description, actions }: PiPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-poppins sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
