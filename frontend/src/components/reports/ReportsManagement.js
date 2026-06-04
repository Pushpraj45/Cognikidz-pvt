import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import { motion } from 'framer-motion';
import { debounce } from 'lodash';
import { Link, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import ReportPreviewModal from './ReportPreviewModal';
import LogoLoader from '../ui/LogoLoader';

// Helper function to format child names properly
const formatChildName = childName => {
  if (!childName || childName.trim() === '') return 'Child Assessment';
  // Remove any "N/A" text and clean up the name
  return childName.replace(/\s*N\/A\s*/gi, '').trim() || 'Child Assessment';
};

// Status badge component
const StatusBadge = ({ status }) => {
  const statusStyles = {
    completed:
      'bg-green-100/70 text-green-800 dark:bg-green-900/40 dark:text-green-400 border border-white/10 dark:border-green-800/20',
    active:
      'bg-blue-100/70 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 border border-white/10 dark:border-blue-800/20',
    paused:
      'bg-yellow-100/70 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 border border-white/10 dark:border-yellow-800/20',
    // Keep legacy values for backward compatibility
    complete:
      'bg-green-100/70 text-green-800 dark:bg-green-900/40 dark:text-green-400 border border-white/10 dark:border-green-800/20',
    'in-progress':
      'bg-blue-100/70 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 border border-white/10 dark:border-blue-800/20',
    pending:
      'bg-yellow-100/70 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 border border-white/10 dark:border-yellow-800/20',
    incomplete:
      'bg-red-100/70 text-red-800 dark:bg-red-900/40 dark:text-red-400 border border-white/10 dark:border-red-800/20',
    default:
      'bg-gray-100/70 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300 border border-white/10 dark:border-gray-600/20',
  };

  // Map status to display text
  const statusText = {
    completed: 'Completed',
    active: 'Active',
    paused: 'Paused',
    // Legacy mappings
    complete: 'Complete',
    'in-progress': 'In Progress',
    pending: 'Pending',
    incomplete: 'Incomplete',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.default}`}
    >
      {statusText[status] || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Action button with dropdown
const ActionButton = ({ report, onPreview, onDelete, onDownload }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
      >
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg py-1 bg-white/90 dark:bg-gray-800/90 border border-white/20 dark:border-gray-700/30 ring-1 ring-black/5 focus:outline-none"
        >
          <button
            onClick={() => {
              onPreview(report);
              setIsOpen(false);
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
          >
            <EyeIcon className="mr-3 h-4 w-4" />
            Preview
          </button>

          <button
            onClick={() => {
              onDownload(report);
              setIsOpen(false);
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
          >
            <ArrowDownTrayIcon className="mr-3 h-4 w-4" />
            Download PDF
          </button>

          <button
            onClick={() => {
              onDelete(report);
              setIsOpen(false);
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20"
          >
            <TrashIcon className="mr-3 h-4 w-4" />
            Delete
          </button>
        </motion.div>
      )}
    </div>
  );
};

// Global filter input
const GlobalFilter = ({ globalFilter, setGlobalFilter, placeholder = 'Search reports...' }) => {
  const [value, setValue] = useState(globalFilter);

  const debouncedSetFilter = useCallback(
    debounce(value => {
      setGlobalFilter(value || undefined);
    }, 300),
    [setGlobalFilter]
  );

  const handleChange = e => {
    setValue(e.target.value);
    debouncedSetFilter(e.target.value);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        className="block w-full pl-10 pr-3 py-2 border border-white/20 dark:border-gray-700/30 rounded-md bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 focus:ring-primary focus:border-primary sm:text-sm shadow-sm"
      />
    </div>
  );
};

const ReportsManagement = ({ reports = [], isLoading = false, onDelete, onDownload }) => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  // Debug logging
  useEffect(() => {
    console.log('📊 ReportsManagement received:', {
      reportsCount: reports.length,
      isLoading,
      sampleReport: reports[0],
      allReports: reports,
    });
  }, [reports, isLoading]);

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Define columns for the table
  const columns = useMemo(
    () => [
      {
        Header: 'Child Name',
        accessor: 'childName',
        Cell: ({ value, row }) => (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 bg-primary-100/70 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium">
              {value.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatChildName(value)}
              </p>
            </div>
          </div>
        ),
      },
      {
        Header: 'Assessment Type',
        accessor: 'assessmentType',
        Cell: ({ value }) => (
          <div className="truncate max-w-[150px]">
            <span className="text-sm text-gray-900 dark:text-white">
              {value || 'General Assessment'}
            </span>
          </div>
        ),
      },
      {
        Header: 'Date',
        accessor: 'assessmentDate',
        Cell: ({ value }) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(value).toLocaleDateString()}
          </span>
        ),
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }) => <StatusBadge status={value} />,
      },
      {
        Header: 'Actions',
        id: 'actions',
        Cell: ({ row }) => (
          <div className="flex space-x-2">
            <button
              onClick={() => navigate(`/reports/${row.original.id}`)}
              className="text-primary dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
              title="View full report"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
            <ActionButton
              report={row.original}
              onPreview={() => handlePreview(row.original)}
              onDelete={() => onDelete(row.original.id)}
              onDownload={() => onDownload(row.original.id)}
            />
          </div>
        ),
      },
    ],
    [onDelete, onDownload, navigate]
  );

  // Setup react-table
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize, globalFilter },
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data: reports,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  // Handle preview
  const handlePreview = report => {
    setSelectedReport(report);
    setIsPreviewOpen(true);
  };

  // Handle bulk selection
  const toggleSelectAll = () => {
    if (selectedItems.length === page.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(page.map(row => row.original.id));
    }
  };

  const toggleSelectItem = id => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Handle bulk actions
  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} reports?`)) {
      selectedItems.forEach(id => onDelete(id));
      setSelectedItems([]);
    }
  };

  const handleBulkDownload = () => {
    // Logic for bulk download
    selectedItems.forEach(id => onDownload(id));
    setSelectedItems([]);
  };

  // Render mobile card view
  const renderMobileView = () => (
    <div className="space-y-4">
      {page.map(row => {
        const report = row.original;
        return (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-md p-4 border border-white/20 dark:border-gray-700/30"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {formatChildName(report.childName)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {report.assessmentType || 'General Assessment'}
                </p>
              </div>
              <StatusBadge status={report.status} />
            </div>

            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {new Date(report.assessmentDate).toLocaleDateString()}
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => navigate(`/reports/${report.id}`)}
                className="inline-flex items-center px-2.5 py-1.5 border border-primary-300/80 dark:border-primary-700/80 text-xs font-medium rounded text-primary-700 dark:text-primary-300 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm hover:bg-primary-50/50 dark:hover:bg-primary-900/20"
              >
                <EyeIcon className="h-4 w-4 mr-1" />
                View Full Report
              </button>

              <button
                onClick={() => handlePreview(report)}
                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300/80 dark:border-gray-600/80 text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm hover:bg-gray-50/50 dark:hover:bg-gray-600/50"
              >
                <EyeIcon className="h-4 w-4 mr-1" />
                Preview
              </button>

              <button
                onClick={() => onDownload(report.id)}
                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300/80 dark:border-gray-600/80 text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm hover:bg-gray-50/50 dark:hover:bg-gray-600/50"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                Download
              </button>

              <button
                onClick={() => onDelete(report.id)}
                className="inline-flex items-center px-2.5 py-1.5 border border-red-300/80 dark:border-red-700/80 text-xs font-medium rounded text-red-700 dark:text-red-300 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm hover:bg-red-50/50 dark:hover:bg-red-900/20"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <GlobalFilter globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />

        <div className="flex items-center space-x-2">
          {selectedItems.length > 0 && (
            <>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center px-3 py-2 border border-red-300/80 dark:border-red-700/80 text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-300 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm hover:bg-red-50/50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete Selected
              </button>

              <button
                onClick={handleBulkDownload}
                className="inline-flex items-center px-3 py-2 border border-gray-300/80 dark:border-gray-600/80 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm hover:bg-gray-50/50 dark:hover:bg-gray-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                Download Selected
              </button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <LogoLoader size="large" message="Loading reports..." showMessage={true} />
        </div>
      ) : reports.length === 0 ? (
        <div className="py-12 text-center backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-md border border-white/20 dark:border-gray-700/30">
          <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No reports available
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Start an assessment to generate reports for your child.
          </p>
        </div>
      ) : isMobile ? (
        // Mobile card view
        renderMobileView()
      ) : (
        // Desktop table view
        <div className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-md border border-white/20 dark:border-gray-700/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table
              {...getTableProps()}
              className="min-w-full divide-y divide-white/20 dark:divide-gray-700/30"
            >
              <thead className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm">
                {headerGroups.map(headerGroup => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300/80 dark:border-gray-600/80 rounded"
                          checked={selectedItems.length === page.length && page.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>

                    {headerGroup.headers.map(column => (
                      <th
                        {...column.getHeaderProps(column.getSortByToggleProps())}
                        scope="col"
                        className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      >
                        <div className="flex items-center">
                          {column.render('Header')}
                          <span>
                            {column.isSorted ? (
                              column.isSortedDesc ? (
                                <ChevronDownIcon className="h-4 w-4 ml-1" />
                              ) : (
                                <ChevronUpIcon className="h-4 w-4 ml-1" />
                              )
                            ) : null}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody
                {...getTableBodyProps()}
                className="divide-y divide-white/10 dark:divide-gray-700/30"
              >
                {page.map(row => {
                  prepareRow(row);
                  return (
                    <tr
                      {...row.getRowProps()}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-3 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300/80 dark:border-gray-600/80 rounded"
                          checked={selectedItems.includes(row.original.id)}
                          onChange={() => toggleSelectItem(row.original.id)}
                        />
                      </td>

                      {row.cells.map(cell => (
                        <td {...cell.getCellProps()} className="px-3 py-4 whitespace-nowrap">
                          {cell.render('Cell')}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 flex items-center justify-between border-t border-white/20 dark:border-gray-700/30 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300/80 dark:border-gray-600/80 text-sm font-medium rounded-md ${
                  !canPreviousPage
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => nextPage()}
                disabled={!canNextPage}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300/80 dark:border-gray-600/80 text-sm font-medium rounded-md ${
                  !canNextPage
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm'
                }`}
              >
                Next
              </button>
            </div>

            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing{' '}
                  <span className="font-medium">
                    {page.length === 0 ? 0 : pageIndex * pageSize + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min((pageIndex + 1) * pageSize, reports.length)}
                  </span>{' '}
                  of <span className="font-medium">{reports.length}</span> reports
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Rows per page</span>
                  <select
                    value={pageSize}
                    onChange={e => {
                      setPageSize(Number(e.target.value));
                    }}
                    className="border border-white/20 dark:border-gray-700/30 rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  >
                    {[10, 25, 50].map(pageSize => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
                  </select>

                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => previousPage()}
                      disabled={!canPreviousPage}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-white/20 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-sm font-medium ${
                        !canPreviousPage
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronDownIcon className="h-5 w-5 rotate-90" />
                    </button>

                    {pageOptions
                      .slice(
                        Math.max(0, pageIndex - 1),
                        Math.min(pageIndex + 2, pageOptions.length)
                      )
                      .map(page => (
                        <button
                          key={page}
                          onClick={() => gotoPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border border-white/20 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-sm font-medium ${
                            page === pageIndex
                              ? 'z-10 bg-primary-50/70 dark:bg-primary-900/30 border-primary-500/50 dark:border-primary-500/50 text-primary-600 dark:text-primary-400'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          {page + 1}
                        </button>
                      ))}

                    <button
                      onClick={() => nextPage()}
                      disabled={!canNextPage}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-white/20 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-sm font-medium ${
                        !canNextPage
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronDownIcon className="h-5 w-5 -rotate-90" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Preview Modal */}
      {isPreviewOpen && selectedReport && (
        <ReportPreviewModal
          report={selectedReport}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onDownload={() => onDownload(selectedReport.id)}
        />
      )}
    </div>
  );
};

export default ReportsManagement;
