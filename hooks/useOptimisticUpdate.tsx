// hooks/useOptimisticUpdate.ts
import { useState } from 'react';

/**
 * A custom hook for handling optimistic UI updates with automatic rollback on error
 * 
 * @param initialValue The initial state value
 * @returns [currentValue, updateFunction, isPending]
 */
function useOptimisticUpdate<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);
  
  /**
   * Update the value optimistically and perform the update operation
   * 
   * @param newValue The new value to set optimistically
   * @param updateFn The async function to perform the actual update
   * @returns A promise that resolves when the update is complete
   */
  const update = async (newValue: T, updateFn: () => Promise<void>) => {
    const previousValue = value;
    
    // Update optimistically
    setValue(newValue);
    setIsPending(true);
    
    try {
      // Perform the actual update
      await updateFn();
      setIsPending(false);
      return { success: true, error: null };
    } catch (error) {
      // Rollback on error
      setValue(previousValue);
      setIsPending(false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      };
    }
  };
  
  return [value, update, isPending] as const;
}

export default useOptimisticUpdate;