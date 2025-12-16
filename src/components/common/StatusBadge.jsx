import React from 'react';
import { getStatusColor, getPriorityColor } from '../../utils/helpers';
import { twMerge } from 'tailwind-merge';

const StatusBadge = ({ status, type = 'status' }) => {
  const colorClass = type === 'priority' ? getPriorityColor(status) : getStatusColor(status);

  return (
    <span className={twMerge('badge', colorClass)}>
      {status}
    </span>
  );
};

export default StatusBadge;