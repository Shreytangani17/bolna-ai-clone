import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { PlusIcon, DocumentIcon, TrashIcon, PencilIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { knowledgeAPI } from '../services/api';
import toast from 'react-hot-toast';

const KnowledgeBases = () => {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKB, setNewKB] = useState({ name: '', description: '', type: 'documents' });
  const [uploading, setUploading] = useState({});

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  const fetchKnowledgeBases = async () => {
    try {
      const response = await knowledgeAPI.list();
      setKnowledgeBases(response.data.knowledgeBases || []);
    } catch (error) {
      toast.error('Failed to fetch knowledge bases');
    }
  };

  const handleCreate = async () => {
    try {
      await knowledgeAPI.create(newKB);
      toast.success('Knowledge base created successfully');
      setNewKB({ name: '', description: '', type: 'documents' });
      setIsCreateOpen(false);
      fetchKnowledgeBases();
    } catch (error) {
      toast.error('Failed to create knowledge base');
    }
  };

  const handleDelete = async (id) => {
    try {
      await knowledgeAPI.delete(id);
      toast.success('Knowledge base deleted successfully');
      fetchKnowledgeBases();
    } catch (error) {
      toast.error('Failed to delete knowledge base');
    }
  };

  const handleFileUpload = async (kbId, files) => {
    setUploading({ ...uploading, [kbId]: true });
    try {
      await knowledgeAPI.upload(kbId, files);
      toast.success(`${files.length} files uploaded successfully`);
      fetchKnowledgeBases();
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setUploading({ ...uploading, [kbId]: false });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Bases</h1>
          <p className="text-gray-600 mt-2">Manage your AI agent's knowledge sources and training data</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Create Knowledge Base
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Knowledge Base</DialogTitle>
              <DialogDescription>
                Add a new knowledge base to train your AI agents with specific information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <Input
                  value={newKB.name}
                  onChange={(e) => setNewKB({ ...newKB, name: e.target.value })}
                  placeholder="Enter knowledge base name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input
                  value={newKB.description}
                  onChange={(e) => setNewKB({ ...newKB, description: e.target.value })}
                  placeholder="Describe what this knowledge base contains"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newKB.type}
                  onChange={(e) => setNewKB({ ...newKB, type: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="documents">Documents</option>
                  <option value="text">Text Content</option>
                  <option value="urls">Web URLs</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!newKB.name}>
                  Create Knowledge Base
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Knowledge Bases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {knowledgeBases.map((kb) => (
          <Card key={kb.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <DocumentIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{kb.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        kb.status === 'active' ? 'bg-green-100 text-green-800' :
                        kb.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {kb.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm">
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(kb.id)}>
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{kb.description}</CardDescription>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Documents:</span>
                  <span>{kb.documents}</span>
                </div>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span>{kb.size}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span>{new Date(kb.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.csv"
                  onChange={(e) => handleFileUpload(kb.id, Array.from(e.target.files))}
                  className="hidden"
                  id={`upload-${kb.id}`}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => document.getElementById(`upload-${kb.id}`).click()}
                  disabled={uploading[kb.id]}
                >
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  {uploading[kb.id] ? 'Uploading...' : 'Upload Documents'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Upload</CardTitle>
          <CardDescription>
            Drag and drop files here or click to browse. Supported formats: PDF, DOC, TXT, CSV
          </CardDescription>
        </CardHeader>
        <CardContent>
          {knowledgeBases.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No knowledge bases created yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Create a knowledge base first to upload files</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBases;