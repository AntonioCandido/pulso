import React, { useState } from 'react';
import { 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Save, 
  BookOpen, 
  ShieldCheck,
  GitCompare
} from 'lucide-react';
import { FormulaWeights, DisciplineMetric } from '../types';
import { DEFAULT_WEIGHTS, FORMULA_PRESETS, recalculateAllMetrics } from '../utils/calculations';
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
  const [localWeights, setLocalWeights] = useState<FormulaWeights>(() => ({
    ...DEFAULT_WEIGHTS,
    ...weights,
    presetId: weights.presetId || 'estacio',
    presetName: weights.presetName || 'Padrão Estácio',
    pulsoRuleVersion: weights.pulsoRuleVersion || '2.0',
  }));
  const [savedSuccess, setSavedSuccess] = useState(false);

  const activePresetId = localWeights.presetId || 'estacio';

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

  const handleApplyPreset = (presetKey: 'estacio' | 'mec' | 'retention' | 'rigor') => {
    const preset = FORMULA_PRESETS[presetKey];
    setLocalWeights(preset);
    onUpdateWeights(preset);
    if (disciplines.length > 0) {
      const updated = recalculateAllMetrics(disciplines, preset);
      onBatchUpdateDisciplines(updated);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>RF03</span>
            <span aria-hidden="true">·</span>
            <span>Algoritmo Ponderado & Governança Institucional</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#0A3977]">
              Perfil Ativo: {localWeights.presetName || 'Padrão Estácio'} (Pulso {localWeights.pulsoRuleVersion || '2.0'})
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Motor de Fórmulas e Calibragem de Índices
          </h1>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Perfis Pré-calibrados:</span>
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
            <button
              type="button"
              onClick={() => handleApplyPreset('estacio')}
              className={`px-3 py-1.5 text-xs rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                activePresetId === 'estacio'
                  ? 'bg-[#0A3977] text-white font-bold shadow-xs'
                  : 'font-semibold text-slate-700 hover:bg-white'
              }`}
              title="Perfil Default Oficial: utiliza as regras da Matriz Conceitual de Indicadores — Pulso 2.0"
            >
              <Sparkles className={`w-3.5 h-3.5 ${activePresetId === 'estacio' ? 'text-[#FFB800]' : 'text-[#0A3977]'}`} />
              <span>Padrão Estácio</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                  activePresetId === 'estacio'
                    ? 'bg-[#FFB800] text-[#0A3977]'
                    : 'bg-slate-300/80 text-slate-700'
                }`}
              >
                Default
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('mec')}
              className={`px-2.5 py-1.5 text-xs rounded-md transition-all cursor-pointer ${
                activePresetId === 'mec'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'font-medium text-slate-700 hover:bg-white'
              }`}
            >
              Padrão MEC
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('retention')}
              className={`px-2.5 py-1.5 text-xs rounded-md transition-all cursor-pointer ${
                activePresetId === 'retention'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'font-medium text-slate-700 hover:bg-white'
              }`}
            >
              Foco Retenção
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('rigor')}
              className={`px-2.5 py-1.5 text-xs rounded-md transition-all cursor-pointer ${
                activePresetId === 'rigor'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'font-medium text-slate-700 hover:bg-white'
              }`}
            >
              Rigor Avaliativo
            </button>
          </div>
        </div>
      </div>

      {/* Active Profile Governance Banner: Padrão Estácio — Matriz Conceitual de Indicadores — Pulso 2.0 */}
      <div className="bg-white border-2 border-[#0A3977]/20 rounded-xl overflow-hidden shadow-xs">
        <div className="bg-[#0A3977] text-white px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#FFB800]">
          <div className="flex items-center gap-2.5">
            <GitCompare className="w-5 h-5 text-[#FFB800] shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                  Perfil Pré-calibrado: Padrão Estácio — Matriz Conceitual de Indicadores — Pulso 2.0
                </h2>
                {activePresetId === 'estacio' && (
                  <span className="text-[10px] font-extrabold bg-[#FFB800] text-[#0A3977] px-2 py-0.5 rounded uppercase">
                    Ativo por Padrão (Default)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-100 mt-0.5">
                Regras oficiais de apuração acadêmica, fórmulas de avaliação e mudanças estruturais de modelagem de dados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/15 text-white px-2.5 py-1 rounded">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FFB800]" />
              <span>Conformidade Pulso 2.0</span>
            </span>
          </div>
        </div>

        <div className="p-4 bg-[#F4F7FA] grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <div className="font-bold text-[#0A3977] text-[11px]">1. Grau de Aprendizagem</div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              Provas com nota &ge; nota esperada / Total de provas realizadas (questões 2023.1 a 2024.1+).
            </p>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-amber-300 ring-1 ring-amber-200/60">
            <div className="font-bold text-[#0A3977] text-[11px] flex items-center justify-between">
              <span>2. Reprovação (Pulso 2.0)</span>
              <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">Novo 2.0</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              Notas &lt;6 em <code className="font-mono font-semibold">maior(AV,NC,AVS)+(SM1+SM2)</code> / alunos que realizaram ao menos 1 das 3 avaliações.
            </p>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <div className="font-bold text-[#0A3977] text-[11px]">3. Tempo de Estudo</div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              Tempo de navegação no conteúdo da disciplina + <strong>52&apos;</strong> para cada download realizado.
            </p>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <div className="font-bold text-[#0A3977] text-[11px]">4. Adesão AV</div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              Alunos disciplinas que realizaram ao menos uma avaliação <code className="font-mono font-semibold">(AV, NC, AVS, NF)</code> / Total alunos disciplinas.
            </p>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <div className="font-bold text-[#0A3977] text-[11px]">5. Adesão SM (2024.1+)</div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              Todas as modalidades seguem com <code className="font-mono font-semibold">(SM1 e SM2)</code> / Quantidade de alunos disciplinas.
            </p>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <div className="font-bold text-[#0A3977] text-[11px]">6. Frequência & Modelagem</div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              <code className="font-mono font-semibold">Presenças / (Presença + Faltas)</code> com fonte e modelagem estrutural Pulso 2.0.
            </p>
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
                  Learning Health Index (Índice de Saúde — Pulso 2.0)
                </h2>
                <div className="text-[11px] text-slate-500">
                  Avalia a saúde pedagógica global da turma conforme Matriz Conceitual Pulso 2.0 (0 a 100)
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
            LHI = (<strong>{(localWeights.lhi.learningScore * 100).toFixed(0)}%</strong> × Aprendizagem) + (<strong>{(localWeights.lhi.attendance * 100).toFixed(0)}%</strong> × Frequência) + (<strong>{(localWeights.lhi.passRate * 100).toFixed(0)}%</strong> × Aprovação Pulso 2.0) + (<strong>{(localWeights.lhi.lmsAdherence * 100).toFixed(0)}%</strong> × Adesão AV/SM)
          </div>

          {/* Sliders */}
          <div className="space-y-3 text-xs pt-1">
            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Grau de Aprendizagem (Provas &ge; Nota Esperada / Realizadas)</span>
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
                    presetId: 'custom',
                    presetName: 'Personalizado',
                    lhi: { ...localWeights.lhi, learningScore: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Frequência (Presenças / Presença + Faltas)</span>
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
                    presetId: 'custom',
                    presetName: 'Personalizado',
                    lhi: { ...localWeights.lhi, attendance: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Taxa de Aprovação Pulso 2.0 (100 - Reprovação sobre Avaliados AV/NC/AVS)</span>
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
                    presetId: 'custom',
                    presetName: 'Personalizado',
                    lhi: { ...localWeights.lhi, passRate: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Adesão AV (AV, NC, AVS, NF), Adesão SM (SM1+SM2) & Estudo (+52&apos;/download)</span>
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
                    presetId: 'custom',
                    presetName: 'Personalizado',
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
                  Academic Risk Score (Índice de Risco — Pulso 2.0)
                </h2>
                <div className="text-[11px] text-slate-500">
                  Calcula risco de reprovação e retenção pela expressão oficial Pulso 2.0 (0 a 100)
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
            ARS = (<strong>{(localWeights.ars.failureRate * 100).toFixed(0)}%</strong> × Reprovação Pulso 2.0) + (<strong>{(localWeights.ars.infrequency * 100).toFixed(0)}%</strong> × Faltas) + (<strong>{(localWeights.ars.learningDeficit * 100).toFixed(0)}%</strong> × Déficit) + (<strong>{(localWeights.ars.dropoutRisk * 100).toFixed(0)}%</strong> × Evasão)
          </div>

          {/* Sliders */}
          <div className="space-y-3 text-xs pt-1">
            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Reprovação Pulso 2.0: maior(AV,NC,AVS)+(SM1+SM2) &lt; 6 / Avaliados</span>
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
                    presetId: 'custom',
                    presetName: 'Personalizado',
                    ars: { ...localWeights.ars, failureRate: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Infrequência & Faltas Críticas (100 - Presenças / Presença + Faltas)</span>
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
                    presetId: 'custom',
                    presetName: 'Personalizado',
                    ars: { ...localWeights.ars, infrequency: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Déficit de Aprendizagem (100 - Grau de Aprendizagem Pulso 2.0)</span>
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
                    presetId: 'custom',
                    presetName: 'Personalizado',
                    ars: { ...localWeights.ars, learningDeficit: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Taxa de Evasão / Ausência em Avaliações (AV, NC, AVS, NF)</span>
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
                    presetId: 'custom',
                    presetName: 'Personalizado',
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
            Ao salvar, todas as <strong>{disciplines.length} turmas</strong> cadastradas no Pulso Acadêmico serão reindexadas imediatamente com as regras do perfil selecionado.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleApplyPreset('estacio')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão Estácio (Pulso 2.0)</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAndRecalculate}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Pesos & Recalcular Toda a Base</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            Perfil <strong>{localWeights.presetName || 'Padrão Estácio'}</strong> (Matriz Conceitual Pulso {localWeights.pulsoRuleVersion || '2.0'}) aplicado e base acadêmica recalculada com sucesso!
          </span>
        </div>
      )}

      {/* Official Pulso 1.0 vs Pulso 2.0 Conceptual Matrix & Interactive Formula Simulator */}
      <div className="pt-2">
        <PulsoConceptualMatrixTable showSimulator={true} />
      </div>
    </div>
  );
};
