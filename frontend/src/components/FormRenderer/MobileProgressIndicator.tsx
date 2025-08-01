import React from 'react';

interface MobileProgressIndicatorProps {
  currentPage: number;
  totalPages: number;
  currentQuestion: number;
  totalQuestions: number;
  position?: 'top' | 'bottom';
}

export const MobileProgressIndicator: React.FC<MobileProgressIndicatorProps> = ({
  currentPage,
  totalPages,
  currentQuestion,
  totalQuestions,
  position = 'top'
}) => {
  const progressPercentage = Math.round((currentQuestion / totalQuestions) * 100);
  
  // Create array for circles based on pages
  const circles = Array.from({ length: totalPages }, (_, index) => {
    const pageNum = index + 1;
    const isCompleted = pageNum < currentPage;
    const isCurrent = pageNum === currentPage;
    const isFuture = pageNum > currentPage;
    
    return {
      pageNum,
      isCompleted,
      isCurrent,
      isFuture
    };
  });

  const positionClasses = position === 'top' 
    ? 'top-[44px] border-b' // Position below status bar (44px)
    : 'bottom-[80px] border-t';

  return (
    <div className={`mobile-progress-indicator ${position}`}>
      <div className={`fixed left-0 right-0 ${positionClasses} border-white/10 bg-black/60 backdrop-blur-md z-50`}>
        <div className="px-4 py-3">
          {/* Progress text */}
          <div className="flex justify-between items-center mb-3 text-xs">
            <span className="text-white/70">
              Question {currentQuestion} of {totalQuestions}
            </span>
            <span className="text-white font-medium">
              {progressPercentage}% Complete
            </span>
          </div>
          
          {/* Circle progress indicator */}
          <div className="flex items-center justify-center">
            {circles.map((circle, index) => (
              <React.Fragment key={circle.pageNum}>
                {/* Circle */}
                <div className="relative">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300
                      ${circle.isCompleted 
                        ? 'bg-[#5E9EFF] text-white' 
                        : circle.isCurrent 
                          ? 'bg-[#5E9EFF] text-white ring-4 ring-[#5E9EFF]/30 scale-110' 
                          : 'bg-white/10 text-white/40 border border-white/20'
                      }
                    `}
                  >
                    {circle.isCompleted ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      circle.pageNum
                    )}
                  </div>
                </div>
                
                {/* Connector line */}
                {index < circles.length - 1 && (
                  <div 
                    className={`
                      flex-1 h-0.5 mx-2 transition-all duration-300
                      ${circle.isCompleted 
                        ? 'bg-[#5E9EFF]' 
                        : 'bg-white/20'
                      }
                    `}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          
          {/* Progress bar (alternative/additional) */}
          <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#5E9EFF] transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileProgressIndicator;