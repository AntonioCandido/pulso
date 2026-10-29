import React, { useState } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  Save, 
  BookOpen, 
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { FormulaWeights, DisciplineMetric, SystemConfig } from '../types';
import { DEFAULT_WEIGHTS, recalculateAllMetrics } from '../utils/calculations';
import { PulsoConceptualMatrixTable } from './PulsoConceptualMatrixTable';

interface FormulaEngineViewProps {
  weights: FormulaWeights;
  onUpdateWeights: (newWeights: FormulaWeights) => void;
  disciplines: DisciplineMetric[];
  onBatchUpdateDisciplines: (updated: DisciplineMetric[]) => void;
}

export const FormulaEngineView: React.FC<FormulaEngineViewProps> = ({
  weights,
  onUpdateWeights,
  disciplines,
  onBatchUpdateDisciplines,
}) => {
  const [localWeights, setLocalWeights] = useState<FormulaWeights>(weights);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Calculate sum of weights to ensure mathematical consistency (100%)
  const lhiSum = Number(
    (
      localWeights.lhi.learningScore +
      localWeights.lhi.attendance +
      localWeights.lhi.passRate +
      localWeights.lhi.lmsAdherence
    ).toFixed(2)
  );

  const arsSum = Number(
    (
      localWeights.ars.failureRate +
      localWeights.ars.infrequency +
      localWeights.ars.learningDeficit +
      localWeights.ars.dropoutRisk
    ).toFixed(2)
  );

  const handleApplyPreset = (presetName: 'standard' | 'retention' | 'rigor') => {
    let preset: FormulaWeights;
    if (presetName === 'standard') {
      preset = DEFAULT_WEIGHTS;
    } else if (presetName === 'retention') {
      // Prioritizes attendance and dropout prevention
      preset = {
        lhi: {
          learningScore: 0.25,
          attendance: 0.35,
          passRate: 0.20,
          lmsAdherence: 0.20,
        },
        ars: {
          failureRate: 0.30,
          infrequency: 0.40,
          learningDeficit: 0.15,
          dropoutRisk: 0.15,
        },
      };
    } else {
      // Rigor: prioritizes hard grades and pass rates
      preset = {
        lhi: {
          learningScore: 0.45,
          attendance: 0.15,
          passRate: 0.30,
          lmsAdherence: 0.10,
        },
        ars: {
          failureRate: 0.50,
          infrequency: 0.15,
          learningDeficit: 0.25,
          dropoutRisk: 0.10,
        },
      };
    }
    setLocalWeights(preset);
  };

  const handleSaveAndRecalculate = () => {
    onUpdateWeights(localWeights);
    const updated = recalculateAllMetrics(disciplines, localWeights);
    onBatchUpdateDisciplines(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>RF03</span>
            <span aria-hidden="true">·</span>
            <span>Algoritmo Ponderado & Governança Institucional</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Motor de Fórmulas e Calibragem de Índices
          </h1>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Perfis Pré-calibrados:</span>
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
            <button
              onClick={() => handleApplyPreset('standard')}
              className="px-2.5 py-1 text-xs font-medium rounded hover:bg-white text-slate-700"
            >
              Padrão MEC
            </button>
            <button
              onClick={() => handleApplyPreset('retention')}
              className="px-2.5 py-1 text-xs font-medium rounded hover:bg-white text-slate-700"
            >
              Foco Retenção
            </button>
            <button
              onClick={() => handleApplyPreset('rigor')}
              className="px-2.5 py-1 text-xs font-medium rounded hover:bg-white text-slate-700"
            >
              Rigor Avaliativo
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 formula cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: LHI Formula */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                LHI
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Learning Health Index (Índice de Saúde)
                </h2>
                <div className="text-[11px] text-slate-500">
                  Avalia a saúde pedagógica global da turma (0 a 100)
                </div>
              </div>
            </div>

            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                lhiSum === 1.0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              Soma: {(lhiSum * 100).toFixed(0)}%
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] text-slate-700">
            LHI = (<strong>{(localWeights.lhi.learningScore * 100).toFixed(0)}%</strong> × Aprendizagem) + (<strong>{(localWeights.lhi.attendance * 100).toFixed(0)}%</strong> × Frequência) + (<strong>{(localWeights.lhi.passRate * 100).toFixed(0)}%</strong> × Retenção) + (<strong>{(localWeights.lhi.lmsAdherence * 100).toFixed(0)}%</strong> × LMS)
          </div>

          {/* Sliders */}
          <div className="space-y-3 text-xs pt-1">
            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Grau de Aprendizagem (Avaliações / GPA)</span>
                <span className="font-mono tabular-nums font-bold">
                  {(localWeights.lhi.learningScore * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={localWeights.lhi.learningScore}
                onChange={(e) =>
                  setLocalWeights({
                    ...localWeights,
                    lhi: { ...localWeights.lhi, learningScore: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Frequência em Sala de Aula</span>
                <span className="font-mono tabular-nums font-bold">
                  {(localWeights.lhi.attendance * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={localWeights.lhi.attendance}
                onChange={(e) =>
                  setLocalWeights({
                    ...localWeights,
                    lhi: { ...localWeights.lhi, attendance: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Taxa de Aprovação Efetiva (100 - Reprovação)</span>
                <span className="font-mono tabular-nums font-bold">
                  {(localWeights.lhi.passRate * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={localWeights.lhi.passRate}
                onChange={(e) =>
                  setLocalWeights({
                    ...localWeights,
                    lhi: { ...localWeights.lhi, passRate: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Adesão & Interações no LMS (Moodle / Blackboard)</span>
                <span className="font-mono tabular-nums font-bold">
                  {(localWeights.lhi.lmsAdherence * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={localWeights.lhi.lmsAdherence}
                onChange={(e) =>
                  setLocalWeights({
                    ...localWeights,
                    lhi: { ...localWeights.lhi, lmsAdherence: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: ARS Formula */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                ARS
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Academic Risk Score (Índice de Risco)
                </h2>
                <div className="text-[11px] text-slate-500">
                  Calcula probabilidade de retenção, reprovação ou evasão (0 a 100)
                </div>
              </div>
            </div>

            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                arsSum === 1.0
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              Soma: {(arsSum * 100).toFixed(0)}%
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] text-slate-700">
            ARS = (<strong>{(localWeights.ars.failureRate * 100).toFixed(0)}%</strong> × Reprovação) + (<strong>{(localWeights.ars.infrequency * 100).toFixed(0)}%</strong> × Faltas) + (<strong>{(localWeights.ars.learningDeficit * 100).toFixed(0)}%</strong> × Déficit) + (<strong>{(localWeights.ars.dropoutRisk * 100).toFixed(0)}%</strong> × Evasão)
          </div>

          {/* Sliders */}
          <div className="space-y-3 text-xs pt-1">
            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Taxa de Reprovação Observada</span>
                <span className="font-mono tabular-nums font-bold">
                  {(localWeights.ars.failureRate * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={localWeights.ars.failureRate}
                onChange={(e) =>
                  setLocalWeights({
                    ...localWeights,
                    ars: { ...localWeights.ars, failureRate: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Infrequência & Faltas Críticas (100 - Presença)</span>
                <span className="font-mono tabular-nums font-bold">
                  {(localWeights.ars.infrequency * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={localWeights.ars.infrequency}
                onChange={(e) =>
                  setLocalWeights({
                    ...localWeights,
                    ars: { ...localWeights.ars, infrequency: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Déficit de Aprendizagem (100 - Média Avaliativa)</span>
                <span className="font-mono tabular-nums font-bold">
                  {(localWeights.ars.learningDeficit * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={localWeights.ars.learningDeficit}
                onChange={(e) =>
                  setLocalWeights({
                    ...localWeights,
                    ars: { ...localWeights.ars, learningDeficit: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Taxa Histórica de Evasão / Desistência</span>
                <span className="font-mono tabular-nums font-bold">
                  {(localWeights.ars.dropoutRisk * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={localWeights.ars.dropoutRisk}
                onChange={(e) =>
                  setLocalWeights({
                    ...localWeights,
                    ars: { ...localWeights.ars, dropoutRisk: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recalculate and Save Actions */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>
            Ao salvar, todas as <strong>{disciplines.length} turmas</strong> cadastradas no Pulso Acadêmico serão reindexadas imediatamente.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocalWeights(DEFAULT_WEIGHTS)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <button
            onClick={handleSaveAndRecalculate}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Pesos & Recalcular Toda a Base</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Fórmulas atualizadas com sucesso! Toda a base acadêmica foi recalculada.</span>
        </div>
      )}

      {/* Official Pulso 1.0 vs Pulso 2.0 Conceptual Matrix & Interactive Formula Simulator */}
      <div className="pt-2">
        <PulsoConceptualMatrixTable showSimulator={true} />
      </div>
    </div>
  );
};
