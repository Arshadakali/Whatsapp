import { Clock, ExternalLink, Share2, Bookmark, MapPin, Building2, Trash2 } from 'lucide-react';

export interface ContentItem {
  id: string | number;
  title: string;
  description: string;
  category: 'technology' | 'scholarships' | 'jobs';
  date: string;
  link?: string;
  deadline?: string;
  location?: string;
  organization?: string;
  tags?: string[];
}

interface ContentCardProps {
  item: ContentItem;
  onDelete?: (id: string | number) => void;
}

export function ContentCard({ item, onDelete }: ContentCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technology':
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
      case 'scholarships':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'jobs':
        return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'technology':
        return 'Technology';
      case 'scholarships':
        return 'Scholarship';
      case 'jobs':
        return 'Job';
      default:
        return category;
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300">
      {/* Color Strip */}
      <div className={`h-2 ${getCategoryColor(item.category).replace('text-white', '')}`}></div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${getCategoryColor(item.category)}`}>
                {getCategoryLabel(item.category)}
              </span>
              {item.deadline && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg border border-red-200">
                  <Clock className="w-3.5 h-3.5" />
                  {item.deadline}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
              {item.title}
            </h3>
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all">
              <Bookmark className="w-5 h-5" />
            </button>
            {onDelete && (
              <button 
                onClick={() => onDelete(item.id)}
                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Delete Post"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
          {item.description}
        </p>

        {/* Meta Information */}
        <div className="space-y-2.5 mb-4">
          {item.organization && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
                <Building2 className="w-4 h-4 text-gray-600" />
              </div>
              <span className="font-medium">{item.organization}</span>
            </div>
          )}
          {item.location && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-600" />
              </div>
              <span>{item.location}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {item.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-50 text-gray-700 text-xs font-medium hover:bg-gray-100 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-5 border-t border-gray-100">
          <span className="text-sm text-gray-500 font-medium">{item.date}</span>
          <div className="flex items-center gap-2">
            <button className="p-2.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all">
              <Share2 className="w-4 h-4" />
            </button>
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all text-sm font-semibold"
              >
                View Details
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
