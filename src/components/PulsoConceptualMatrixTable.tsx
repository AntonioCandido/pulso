import React, { useState } from 'react';
import { 
  BookOpen, 
  Calculator, 
  GitCompare, 
  Info, 
  Sparkles, 
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import {
  PULSO_CONCEPTUAL_MATRIX,
  PULSO_STRUCTURAL_NOTE,
  calculatePulsoLearningGrade,
  calculatePulsoFailureRate,
  evaluateStudentFinalExpression,
  calculatePulsoStudyTime,
  calculatePulsoAdhesionAV,
  calculatePulsoAdhesionSM,
  calculatePulsoAttendanceRate,
} from '../utils/calculations';

interface PulsoConceptualMatrixTableProps {
  showSimulator?: boolean;
}

/**
 * Componente que incorpora fielmente a Matriz Conceitual Comparativa Pulso 1.0 vs. Pulso 2.0
 * (conforme a imagem de referência enviada) e disponibiliza o simulador interativo das expressões.
 */
export const PulsoConceptualMatrixTable: React.FC<PulsoConceptualMatrixTableProps> = ({
  showSimulator = false,
}) => {
  // Estados do Simulador Interativo das Expressões Oficiais (Pulso 1.0 & Pulso 2.0)
  // 1. Grau de Aprendizagem
  const [examsPassedExpected, setExamsPassedExpected] = useState<number>(57);
  const [totalExamsDone, setTotalExamsDone] = useState<number>(100);

  // 2. Reprovação (Pulso 1.0 vs Pulso 2.0) & Expressão Individual
  const [studentsGradeUnderSix, setStudentsGradeUnderSix] = useState<number>(8);
  const [totalStudentsEnrolled, setTotalStudentsEnrolled] = useState<number>(100);
  const [studentsDidAtLeastOneExam, setStudentsDidAtLeastOneExam] = useState<number>(88);

  // Simulador individual de nota: maior(AV, NC, AVS) + (SM1 + SM2)
  const [simAV, setSimAV] = useState<number>(4.5);
  const [simNC, setSimNC] = useState<number>(0);
  const [simAVS, setSimAVS] = useState<number>(5.0);
  const [simSM1, setSimSM1] = useState<number>(0.5);
  const [simSM2, setSimSM2] = useState<number>(0.5);

  // 3. Tempo de Estudo: Navegação + 52' por download
  const [navMinutes, setNavMinutes] = useState<number>(616);
  const [downloadsCount, setDownloadsCount] = useState<number>(10);

  // 4. Adesão AV & 5. Adesão SM & 6. Frequência
  const [studentsDidAV, setStudentsDidAV] = useState<number>(81);
  const [studentsDidSM, setStudentsDidSM] = useState<number>(66);
  const [presencesCount, setPresencesCount] = useState<number>(858);
  const [absencesCount, setAbsencesCount] = useState<number>(142);

  // Cálculos derivados pelas funções oficiais
  const calcLearningGrade = calculatePulsoLearningGrade(examsPassedExpected, totalExamsDone);
  const calcFailureV1 = calculatePulsoFailureRate(
    studentsGradeUnderSix,
    totalStudentsEnrolled,
    studentsDidAtLeastOneExam,
    '1.0'
  );
  const calcFailureV2 = calculatePulsoFailureRate(
    studentsGradeUnderSix,
    totalStudentsEnrolled,
    studentsDidAtLeastOneExam,
    '2.0'
  );
  const studentEval = evaluateStudentFinalExpression(simAV, simNC, simAVS, simSM1, simSM2);
  const calcStudyTime = calculatePulsoStudyTime(navMinutes, downloadsCount);
  const calcAdhesionAV = calculatePulsoAdhesionAV(studentsDidAV, totalStudentsEnrolled);
  const calcAdhesionSM = calculatePulsoAdhesionSM(studentsDidSM, totalStudentsEnrolled);
  const calcAttendance = calculatePulsoAttendanceRate(presencesCount, absencesCount);

  return (
    <div className="space-y-6">
      {/* =========================================================================
          TABELA OFICIAL: MATRIZ CONCEITUAL DE INDICADORES (PULSO 1.0 vs. PULSO 2.0)
          Reproduz exatamente a estrutura, cores e textos da imagem de referência
          ========================================================================= */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-[#0A3977] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#FFB800]">
          <div className="flex items-center gap-2.5">
            <GitCompare className="w-5 h-5 text-[#FFB800] shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                Matriz Conceitual de Indicadores — Pulso 1.0 vs. Pulso 2.0
              </h2>
              <p className="text-[11px] text-blue-100">
                Regras oficiais de apuração acadêmica, fórmulas de avaliação e mudanças estruturais de modelagem de dados
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#FFB800] text-[#0A3977] px-2.5 py-1 rounded self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Governança Oficial YDUQS / Estácio</span>
          </span>
        </div>

        {/* Tabela fiel à imagem em anexo */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-slate-900">
            <thead>
              <tr className="bg-[#EDEDED] border-b border-slate-400 text-slate-900">
                <th className="py-2.5 px-4 border-r border-slate-400 w-44 text-center font-bold">
                  {/* Coluna de Indicadores */}
                </th>
                <th className="py-2.5 px-5 border-r border-slate-400 text-center font-semibold text-sm w-[36%]">
                  Pulso 1.0
                </th>
                <th className="py-2.5 px-5 border-r border-slate-400 text-center font-semibold text-sm w-[32%]">
                  Pulso 2.0
                </th>
                <th className="py-2.5 px-4 text-center font-semibold text-sm w-64">
                  {/* Coluna de Observação Estrutural */}
                </th>
              </tr>
            </thead>
            <tbody>
              {PULSO_CONCEPTUAL_MATRIX.map((item, idx) => (
                <tr key={item.id} className="border-b border-slate-400 last:border-b-0">
                  {/* Coluna 1: Nome do Indicador (Fundo Cinza Claro #EDEDED, Centralizado e Negrito) */}
                  <td className="py-4 px-4 bg-[#EDEDED] border-r border-slate-400 font-bold text-center align-middle text-slate-950 text-xs sm:text-[13px]">
                    {item.indicator}
                  </td>

                  {/* Coluna 2: Conceito Pulso 1.0 (Fundo Azul Claro #DCE6F2, Centralizado) */}
                  <td className="py-3.5 px-5 bg-[#DCE6F2] border-r border-slate-400 text-center align-middle leading-relaxed text-slate-900 text-xs sm:text-[13px]">
                    {item.pulso1.map((line, lIdx) => (
                      <div key={lIdx}>{line}</div>
                    ))}
                  </td>

                  {/* Coluna 3: Conceito Pulso 2.0 (Fundo Azul Claro #DCE6F2, Centralizado) */}
                  <td className="py-3.5 px-5 bg-[#DCE6F2] border-r border-slate-400 text-center align-middle leading-relaxed text-slate-900 text-xs sm:text-[13px]">
                    <div className={item.hasChangedInV2 ? 'font-semibold text-slate-950' : ''}>
                      {item.pulso2}
                    </div>
                  </td>

                  {/* Coluna 4: Nota Estrutural Mesclada Verticalmente (rowSpan = 6) */}
                  {idx === 0 && (
                    <td
                      rowSpan={PULSO_CONCEPTUAL_MATRIX.length}
                      className="py-6 px-5 bg-[#DCE6F2] text-center align-middle leading-relaxed text-slate-900 text-xs sm:text-[13px]"
                    >
                      {PULSO_STRUCTURAL_NOTE}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Destaques normativos rápidos */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#0A3977] shrink-0" />
            <span>
              <strong>Principal mudança conceitual no Pulso 2.0:</strong> O denominador da <strong>Reprovação</strong> passa a considerar exclusivamente os alunos disciplinas que realizaram ao menos uma das três avaliações (<strong>AV, NC ou AVS</strong>).
            </span>
          </div>
          <span className="font-mono text-[10px] bg-blue-50 text-[#0A3977] px-2 py-0.5 rounded border border-blue-200 font-semibold">
            Tempo de Estudo = Navegação + 52&apos; × Downloads
          </span>
        </div>
      </div>

      {/* =========================================================================
          SIMULADOR OFICIAL DAS FÓRMULAS DOS INDICADORES (PULSO 1.0 & PULSO 2.0)
          Permite validar na prática cada uma das 6 fórmulas descritas na imagem
          ========================================================================= */}
      {showSimulator && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 text-[#0A3977]">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Simulador de Conformidade das Fórmulas (Pulso 1.0 vs. Pulso 2.0)
                </h3>
                <p className="text-xs text-slate-500">
                  Audite os cálculos exatos de Reprovação, Tempo de Estudo (+52&apos; por download), Grau de Aprendizagem, Adesão AV/SM e Frequência
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full self-start sm:self-auto">
              Motor em Conformidade com Pulso 2.0
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
            {/* Bloco 1: Reprovação Pulso 1.0 vs Pulso 2.0 & Expressão de Nota */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>1. Reprovação (Pulso 1.0 vs 2.0)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                  Mudança Conceitual
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Expressão: <code className="font-mono font-bold text-[#0A3977]">maior(AV, NC, AVS) + (SM1 + SM2) &lt; 6</code>
              </p>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Notas &lt; 6
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={studentsGradeUnderSix}
                    onChange={(e) => setStudentsGradeUnderSix(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5" title="Denominador Pulso 1.0">
                    Total Alunos (1.0)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={totalStudentsEnrolled}
                    onChange={(e) => setTotalStudentsEnrolled(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5" title="Denominador Pulso 2.0">
                    Fizeram AV/NC/AVS
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={studentsDidAtLeastOneExam}
                    onChange={(e) => setStudentsDidAtLeastOneExam(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="block text-[10px] text-slate-500">Pulso 1.0 (Total Alunos)</span>
                  <span className="text-sm font-bold text-slate-800 font-mono">
                    {calcFailureV1.toFixed(2).replace('.', ',')}%
                  </span>
                </div>
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <span className="block text-[10px] text-[#0A3977] font-semibold">Pulso 2.0 (Com Avaliação)</span>
                  <span className="text-sm font-black text-[#0A3977] font-mono">
                    {calcFailureV2.toFixed(2).replace('.', ',')}%
                  </span>
                </div>
              </div>

              {/* Simulador rápido de nota individual do aluno */}
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <span className="block text-[10px] font-bold text-slate-700 uppercase">
                  Teste de Nota do Aluno: maior(AV, NC, AVS) + (SM1 + SM2)
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  <div>
                    <label className="block text-[9px] text-slate-500">AV</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={10}
                      value={simAV}
                      onChange={(e) => setSimAV(Number(e.target.value))}
                      className="w-full px-1.5 py-1 border border-slate-300 rounded bg-white font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500">NC</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={10}
                      value={simNC}
                      onChange={(e) => setSimNC(Number(e.target.value))}
                      className="w-full px-1.5 py-1 border border-slate-300 rounded bg-white font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500">AVS</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={10}
                      value={simAVS}
                      onChange={(e) => setSimAVS(Number(e.target.value))}
                      className="w-full px-1.5 py-1 border border-slate-300 rounded bg-white font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500">SM1</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={2}
                      value={simSM1}
                      onChange={(e) => setSimSM1(Number(e.target.value))}
                      className="w-full px-1.5 py-1 border border-slate-300 rounded bg-white font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500">SM2</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={2}
                      value={simSM2}
                      onChange={(e) => setSimSM2(Number(e.target.value))}
                      className="w-full px-1.5 py-1 border border-slate-300 rounded bg-white font-mono text-[11px]"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] bg-white px-2.5 py-1.5 rounded border border-slate-200">
                  <span>
                    Nota Final: <strong className="font-mono">{studentEval.finalScore.toFixed(1)}</strong>
                  </span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      studentEval.isReproved ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {studentEval.isReproved ? 'Reprovado (< 6,0)' : 'Aprovado (>= 6,0)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bloco 2: Tempo de Estudo (+52' por download) & Grau de Aprendizagem */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>2. Tempo de Estudo & Aprendizagem</span>
                <Clock className="w-4 h-4 text-[#0A3977]" />
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-slate-600">
                  <strong>Tempo de Estudo:</strong> Tempo de navegação no conteúdo + <strong>52&apos;</strong> para cada download realizado.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Navegação (minutos)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={navMinutes}
                      onChange={(e) => setNavMinutes(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Nº Downloads (× 52&apos;)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={downloadsCount}
                      onChange={(e) => setDownloadsCount(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] text-[#0A3977] font-semibold">
                      {navMinutes}&apos; + ({downloadsCount} × 52&apos; = {downloadsCount * 52}&apos;) = {calcStudyTime.totalMinutes} min
                    </span>
                    <span className="text-[10px] text-slate-500">Total convertido em hh:mm</span>
                  </div>
                  <span className="text-base font-black text-[#0A3977] font-mono">
                    {calcStudyTime.formatted} hh:mm
                  </span>
                </div>
              </div>

              {/* Grau de Aprendizagem */}
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <p className="text-[11px] text-slate-600">
                  <strong>Grau de Aprendizagem:</strong> Provas com notas &ge; nota esperada / Total de provas realizadas.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Provas &ge; Nota Esperada
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={examsPassedExpected}
                      onChange={(e) => setExamsPassedExpected(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Total Provas Realizadas
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={totalExamsDone}
                      onChange={(e) => setTotalExamsDone(Math.max(1, Number(e.target.value)))}
                      className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-600">Grau de Aprendizagem Apurado:</span>
                  <span className="text-sm font-black text-emerald-700 font-mono">
                    {calcLearningGrade.toFixed(2).replace('.', ',')}%
                  </span>
                </div>
              </div>
            </div>

            {/* Bloco 3: Adesão AV, Adesão SM (2024.1+) e Frequência */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>3. Adesão AV, Adesão SM & Frequência</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5" title="Fizeram AV, NC, AVS ou NF">
                    Alunos c/ AV/NC/AVS/NF
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={studentsDidAV}
                    onChange={(e) => setStudentsDidAV(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5" title="A partir de 2024.1 todas as modalidades seguem com SM1 e SM2">
                    Alunos c/ SM1 e SM2
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={studentsDidSM}
                    onChange={(e) => setStudentsDidSM(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="block text-[10px] text-slate-500">Adesão AV</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {calcAdhesionAV.toFixed(2).replace('.', ',')}%
                  </span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="block text-[10px] text-slate-500">Adesão SM (2024.1+)</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {calcAdhesionSM.toFixed(2).replace('.', ',')}%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <p className="text-[11px] text-slate-600">
                  <strong>Frequência:</strong> Quantidade de presenças / (Quantidade de presença + faltas)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Qtd. Presenças
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={presencesCount}
                      onChange={(e) => setPresencesCount(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Qtd. Faltas
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={absencesCount}
                      onChange={(e) => setAbsencesCount(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2 py-1 border border-slate-300 rounded bg-white font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-blue-50 px-2.5 py-1.5 rounded border border-blue-200">
                  <span className="text-[11px] text-[#0A3977] font-semibold">
                    {presencesCount} / ({presencesCount} + {absencesCount})
                  </span>
                  <span className="text-sm font-black text-[#0A3977] font-mono">
                    {calcAttendance.toFixed(2).replace('.', ',')}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
