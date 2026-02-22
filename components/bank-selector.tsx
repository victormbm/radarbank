"use client";

import { useState } from "react";
import { BRAZILIAN_BANKS, BrazilianBank } from "@/lib/brazilian-banks";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Building2, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

interface BankSelectorProps {
  onSelectBank: (bank: BrazilianBank) => void;
  selectedBank?: BrazilianBank | null;
}

export function BankSelector({ onSelectBank, selectedBank }: BankSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "digital" | "traditional">("all");

  const filteredBanks = BRAZILIAN_BANKS.filter((bank) => {
    const matchesSearch = bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || bank.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600" />
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Selecione um Banco</h2>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar banco..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setFilterType("all")}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all",
              filterType === "all"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            )}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType("digital")}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all",
              filterType === "digital"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            )}
          >
            Digitais
          </button>
          <button
            onClick={() => setFilterType("traditional")}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all",
              filterType === "traditional"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            )}
          >
            Tradicionais
          </button>
        </div>
      </div>

      {/* Banks Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
        {filteredBanks.map((bank) => (
          <Card
            key={bank.id}
            onClick={() => onSelectBank(bank)}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1",
              "group relative overflow-hidden",
              selectedBank?.id === bank.id
                ? "ring-2 ring-purple-600 shadow-lg scale-105"
                : "hover:ring-2 hover:ring-purple-300 shadow-sm"
            )}
          >
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity",
              bank.color.gradient
            )} />
            
            <div className="p-3 sm:p-4 lg:p-5 flex flex-col items-center gap-2 sm:gap-3 relative">
              {/* Icon */}
              <div className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl flex items-center justify-center text-2xl sm:text-3xl",
                "bg-gradient-to-br shadow-md",
                bank.color.gradient
              )}>
                {bank.icon}
              </div>

              {/* Bank Name */}
              <div className="text-center">
                <h3 className="font-semibold text-sm text-slate-900 line-clamp-1">
                  {bank.shortName}
                </h3>
                <p className={cn(
                  "text-xs mt-0.5",
                  bank.type === "digital" ? "text-purple-600" : "text-slate-500"
                )}>
                  {bank.type === "digital" ? "Digital" : "Tradicional"}
                </p>
              </div>

              {/* Selected Indicator */}
              {selectedBank?.id === bank.id && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-purple-600 rounded-full animate-pulse" />
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredBanks.length === 0 && (
        <div className="text-center py-16 sm:py-20 px-4">
          <Filter className="h-12 w-12 sm:h-16 sm:w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-sm sm:text-base">
            Nenhum banco encontrado com os filtros aplicados
          </p>
        </div>
      )}
    </div>
  );
}
