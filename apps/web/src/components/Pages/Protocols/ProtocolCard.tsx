/**
 * Protocol Card Component
 *
 * Displays individual protocol information with details and links
 * Extracted from ProtocolsPageContent for better maintainability
 */

import type { Protocol, ProtocolLabels } from './types';

interface ProtocolCardProps {
  protocol: Protocol;
  labels: ProtocolLabels;
}

export function ProtocolCard({ protocol, labels }: ProtocolCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h4 className="text-xl font-bold text-slate-900 mb-2">{protocol.name}</h4>
      <p className="text-slate-600 mb-4">{protocol.description}</p>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">{labels.founded}</span>
          <span className="font-medium text-slate-900">{protocol.founded}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">{labels.tvl}</span>
          <span className="font-medium text-slate-900">{protocol.tvl}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">{labels.blockchains}</span>
          <span className="font-medium text-slate-900 text-right max-w-[200px]">{protocol.blockchains}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">{labels.audits}</span>
          <span className="font-medium text-slate-900">{protocol.audits}</span>
        </div>
        <div className="flex justify-between items-start pt-1">
          <span className="text-slate-500">{labels.regulatory}</span>
          <span className={`font-medium text-right max-w-[250px] ${
            protocol.hasWarning ? 'text-amber-600' :
            protocol.hasSuccess ? 'text-teal-600' : 'text-slate-900'
          }`}>
            {protocol.hasWarning && '⚠️ '}
            {protocol.hasSuccess && '✅ '}
            {protocol.regulatory}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex gap-4">
        <a
          href={protocol.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-600 hover:text-teal-700 text-sm font-medium"
        >
          Website →
        </a>
        <a
          href={protocol.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-slate-700 text-sm"
        >
          @Twitter
        </a>
      </div>
    </div>
  );
}

export default ProtocolCard;
