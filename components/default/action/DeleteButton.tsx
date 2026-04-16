import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { Trash2 } from 'lucide-react';
import { NextPage } from 'next';
import Image from 'next/image';
import { ReactNode, useState } from 'react';

interface Props {
  handler: () => Promise<void>;
  children?: ReactNode;
}

const DeleteButton: NextPage<Props> = ({ handler, children }) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false)
  const handlePopup = () => {
    console.log('handled');
    setShowModal(true);
  };
  const handleDelete = async () => {
    setIsLoading(true)
    await handler();
    setIsLoading(false)
    setShowModal(false);
  };
  return (
    <>
      {children ? (
        <div onClick={handlePopup}>{children}</div>
      ) : (
        <Button
          onClick={handlePopup}
          variant={'destructive'}
          className="p-2 hover:cursor-pointer"
        >
          <Trash2 />
        </Button>
      )}
      {showModal && (
        <Dialog
          defaultOpen={showModal}
          onOpenChange={setShowModal}
          open={showModal}
        >
          <DialogContent>
            <DialogTitle></DialogTitle>
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <Trash2 />
              </div>
              <p className="font-bold">Are you sure want to delete this?</p>
              <p className="text-gray-90 my-1">
                This action will permanently remove item from system. You wont
                be able to undo this.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setShowModal(false)}
                variant={'outline'}
                className="w-full"
              >
                Cancel
              </Button>

              <Button
                onClick={handleDelete}
                variant={'destructive'}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? <Spinner /> : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default DeleteButton;
