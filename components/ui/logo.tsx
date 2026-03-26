import Image from "next/image";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 64, showText = true, className = "" }: LogoProps) {
  const textSize = size >= 64 ? "text-2xl" : size >= 48 ? "text-xl" : "text-lg";
  const subtitleSize = size >= 64 ? "text-sm" : size >= 48 ? "text-xs" : "text-[10px]";
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        <Image
          src="/assets/icons/iconFavicon1.png"
          alt="Banco Seguro BR"
          width={size}
          height={size}
          className="drop-shadow-2xl relative z-10"
          priority
        />
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/30 to-purple-600/30 rounded-full blur-2xl animate-pulse"></div>
      </div>
      {showText && (
        <div className="text-left">
          <span className={`${textSize} font-bold bg-gradient-to-r from-white via-purple-100 to-cyan-100 bg-clip-text text-transparent block leading-tight`}>
            Banco Seguro BR
          </span>
          <span className={`${subtitleSize} text-purple-300 font-medium`}>Monitor de Saúde Bancária</span>
        </div>
      )}
    </div>
  );
}
