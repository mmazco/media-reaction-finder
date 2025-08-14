from flask import Blueprint, jsonify, request, Response
from search_logger import SearchLogger
from datetime import datetime, timedelta
import json

analytics_bp = Blueprint('analytics', __name__)
search_logger = SearchLogger()

@analytics_bp.route('/api/analytics/dashboard', methods=['GET'])
def get_dashboard_data():
    """Get analytics dashboard data"""
    try:
        days = request.args.get('days', 30, type=int)
        analytics = search_logger.get_analytics(days=days)
        
        # Add categorized searches, category stats, and source distribution
        categorized_searches = search_logger.get_categorized_searches(limit=50, days=days)
        category_stats = search_logger.get_category_stats(days=days)
        source_distribution = search_logger.get_source_distribution(days=days)
        
        analytics['categorized_searches'] = categorized_searches
        analytics['category_stats'] = category_stats
        analytics['source_distribution'] = source_distribution
        
        return jsonify({
            'success': True,
            'data': analytics
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@analytics_bp.route('/api/analytics/history', methods=['GET'])
def get_search_history():
    """Get search history with optional filters"""
    try:
        limit = request.args.get('limit', 100, type=int)
        search_type = request.args.get('type')
        date_from = request.args.get('from')
        date_to = request.args.get('to')
        
        history = search_logger.get_search_history(
            limit=limit,
            search_type=search_type,
            date_from=date_from,
            date_to=date_to
        )
        
        return jsonify({
            'success': True,
            'data': history,
            'count': len(history)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@analytics_bp.route('/api/analytics/export', methods=['GET'])
def export_search_data():
    """Export search data in various formats"""
    try:
        format_type = request.args.get('format', 'json').lower()
        date_from = request.args.get('from')
        date_to = request.args.get('to')
        
        if format_type not in ['json', 'csv']:
            return jsonify({
                'success': False,
                'error': 'Invalid format. Use json or csv'
            }), 400
        
        data = search_logger.export_data(
            format=format_type,
            date_from=date_from,
            date_to=date_to
        )
        
        # Set appropriate content type and filename
        if format_type == 'csv':
            response = Response(
                data,
                mimetype='text/csv',
                headers={
                    'Content-Disposition': f'attachment; filename=search_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
                }
            )
        else:
            response = Response(
                data,
                mimetype='application/json',
                headers={
                    'Content-Disposition': f'attachment; filename=search_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
                }
            )
        
        return response
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@analytics_bp.route('/api/analytics/stats', methods=['GET'])
def get_quick_stats():
    """Get quick statistics for the header/overview"""
    try:
        # Get today's stats
        today = datetime.now().date()
        history_today = search_logger.get_search_history(
            limit=1000,
            date_from=today,
            date_to=today
        )
        
        # Get this week's stats
        week_ago = today - timedelta(days=7)
        history_week = search_logger.get_search_history(
            limit=1000,
            date_from=week_ago,
            date_to=today
        )
        
        # Get all time stats
        analytics = search_logger.get_analytics(days=365)
        
        stats = {
            'today': {
                'searches': len(history_today),
                'unique_queries': len(set(item['query'] for item in history_today))
            },
            'this_week': {
                'searches': len(history_week),
                'unique_queries': len(set(item['query'] for item in history_week))
            },
            'all_time': analytics['overall_stats']
        }
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@analytics_bp.route('/api/analytics/trends', methods=['GET'])
def get_search_trends():
    """Get search trends and patterns"""
    try:
        days = request.args.get('days', 30, type=int)
        
        # Get hourly distribution
        history = search_logger.get_search_history(limit=10000, date_from=(datetime.now() - timedelta(days=days)).date())
        
        # Analyze hourly patterns
        hourly_distribution = {}
        daily_counts = {}
        
        for item in history:
            timestamp = datetime.fromisoformat(item['timestamp'].replace('Z', '+00:00'))
            hour = timestamp.hour
            date = timestamp.date().isoformat()
            
            hourly_distribution[hour] = hourly_distribution.get(hour, 0) + 1
            daily_counts[date] = daily_counts.get(date, 0) + 1
        
        # Convert to lists for easier frontend consumption
        hourly_data = [{'hour': h, 'count': hourly_distribution.get(h, 0)} for h in range(24)]
        daily_data = [{'date': date, 'count': count} for date, count in sorted(daily_counts.items())]
        
        return jsonify({
            'success': True,
            'data': {
                'hourly_distribution': hourly_data,
                'daily_counts': daily_data
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500