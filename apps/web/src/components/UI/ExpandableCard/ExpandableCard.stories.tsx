/**
 * ExpandableCard Stories
 *
 * Demonstrates collapsed/expanded states, single-expand grid, and multi-expand grid.
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { ExpandableCard } from './ExpandableCard';
import { ExpandableCardGrid } from './ExpandableCardGrid';
import { Target, ShieldCheck, Gift } from '@/components/UI/LucideIcon';
import { useState } from 'react';

const meta: Meta<typeof ExpandableCard> = {
  title: 'UI/ExpandableCard',
  component: ExpandableCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Shared expandable card pattern used for goal cards, strategies, and protocols.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ExpandableCard>;

// Single card — collapsed
export const Collapsed: Story = {
  render: () => {
    const [expanded, setExpanded] = useState(false);
    return (
      <ExpandableCard
        id="demo-collapsed"
        icon={Target}
        title="Retirement Plan"
        titleSummary="$79k more"
        expandLabel="Show more"
        collapseLabel="Show less"
        isExpanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      >
        <p>Detailed information about the retirement plan scenario.</p>
      </ExpandableCard>
    );
  },
};

// Single card — expanded
export const Expanded: Story = {
  render: () => {
    const [expanded, setExpanded] = useState(true);
    return (
      <ExpandableCard
        id="demo-expanded"
        icon={ShieldCheck}
        title="Emergency Fund"
        titleSummary="~15 months less"
        expandLabel="Show more"
        collapseLabel="Show less"
        isExpanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      >
        <p>Emergency fund details showing time saved with diBoaS vs traditional banking.</p>
      </ExpandableCard>
    );
  },
};

// Grid — single expand mode (like goal cards)
export const SingleExpandGrid: Story = {
  render: () => (
    <ExpandableCardGrid multiExpand={false}>
      {({ isExpanded, onToggle }) => (
        <>
          {['card-1', 'card-2', 'card-3'].map((id, i) => (
            <ExpandableCard
              key={id}
              id={id}
              icon={[Target, ShieldCheck, Gift][i]}
              title={['Retirement', 'Emergency Fund', 'Christmas Bonus'][i]}
              titleSummary={['$79k more', '~15 months', '$181 more'][i]}
              expandLabel="Show more"
              collapseLabel="Show less"
              isExpanded={isExpanded(id)}
              onToggle={onToggle}
            >
              <p>Detailed content for {['Retirement', 'Emergency Fund', 'Christmas Bonus'][i]}.</p>
            </ExpandableCard>
          ))}
        </>
      )}
    </ExpandableCardGrid>
  ),
};

// Grid — multi expand mode (like strategy cards)
export const MultiExpandGrid: Story = {
  render: () => (
    <ExpandableCardGrid multiExpand={true}>
      {({ isExpanded, onToggle }) => (
        <>
          {['safe-harbor', 'steady-growth', 'balanced-builder'].map((id, i) => (
            <ExpandableCard
              key={id}
              id={id}
              title={['Safe Harbor', 'Steady Growth', 'Balanced Builder'][i]}
              titleSummary={['6-10% / year', '7-12% / year', '10-16% / year'][i]}
              expandLabel="Show more"
              collapseLabel="Show less"
              isExpanded={isExpanded(id)}
              onToggle={onToggle}
            >
              <p>Strategy details for {['Safe Harbor', 'Steady Growth', 'Balanced Builder'][i]}.</p>
              <p>Allocation, stats, and risk information would appear here.</p>
            </ExpandableCard>
          ))}
        </>
      )}
    </ExpandableCardGrid>
  ),
};
